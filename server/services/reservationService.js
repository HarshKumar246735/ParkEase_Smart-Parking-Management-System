import mongoose from 'mongoose';
import ParkingReservation from '../models/ParkingReservation.js';
import ParkingSession from '../models/ParkingSession.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Vehicle from '../models/Vehicle.js';
import { reconcile } from './parkingAvailabilityService.js';
import { expireReservationById, freeSlotForReservation } from './reservationExpiryService.js';
import { getSettings, getRate } from './settingsService.js';
import { generateReference } from '../utils/generateReference.js';
import { assertTransition } from '../utils/slotStateMachine.js';
import { notFound, conflict, gone, badRequest } from '../utils/ApiError.js';

export const reservationPopulate = [
  { path: 'vehicleId', select: 'registrationNumber vehicleType nickname' },
  { path: 'slotId', select: 'slotNumber slotType status floorId zoneId', populate: [{ path: 'floorId', select: 'name code' }, { path: 'zoneId', select: 'name code' }] },
];

export async function loadReservation(filter) {
  return ParkingReservation.findOne(filter).populate(reservationPopulate);
}

const BLOCKED_MESSAGES = {
  RESERVED: 'This slot has just been reserved by someone else',
  OCCUPIED: 'This slot is currently occupied',
  RELEASE_PENDING: 'This slot is being released and will be available shortly',
  MAINTENANCE: 'This slot is under maintenance',
};

export async function createReservation(userId, { vehicleId, slotId }) {
  await reconcile({ force: true });
  const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });
  if (!vehicle) throw notFound('Vehicle not found');

  const slot = await ParkingSlot.findById(slotId).populate('floorId', 'active').populate('zoneId', 'active');
  if (!slot) throw notFound('Parking slot not found');
  if (slot.floorId?.active === false || slot.zoneId?.active === false) throw conflict('This area is currently closed', 'AREA_CLOSED');
  if (slot.slotType === 'EV_CHARGING' && vehicle.vehicleType !== 'ELECTRIC') {
    throw badRequest('EV charging slots are reserved for Electric Vehicles');
  }
  if (slot.status !== 'AVAILABLE') throw conflict(BLOCKED_MESSAGES[slot.status] || 'Slot is not available', 'SLOT_UNAVAILABLE');

  const [openRes, openSession] = await Promise.all([
    ParkingReservation.exists({ vehicleId: vehicle._id, status: 'ACTIVE' }),
    ParkingSession.exists({ vehicleId: vehicle._id, open: true }),
  ]);
  if (openRes || openSession) throw conflict('This vehicle already has an active reservation or parking session', 'VEHICLE_BUSY');

  const settings = await getSettings();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + settings.arrivalWindowMinutes * 60000);
  const _id = new mongoose.Types.ObjectId();

  assertTransition('AVAILABLE', 'RESERVED');
  // atomic claim: only one concurrent request can flip AVAILABLE -> RESERVED
  const claimed = await ParkingSlot.findOneAndUpdate(
    { _id: slot._id, status: 'AVAILABLE' },
    { $set: { status: 'RESERVED', activeReservationId: _id } },
    { new: true }
  );
  if (!claimed) throw conflict('Someone else just booked this slot. Please choose another.', 'SLOT_UNAVAILABLE');

  try {
    await ParkingReservation.create({
      _id,
      reservationNumber: generateReference('RSV'),
      userId,
      vehicleId: vehicle._id,
      slotId: slot._id,
      createdAt: now,
      expiresAt,
      status: 'ACTIVE',
    });
  } catch (e) {
    await ParkingSlot.updateOne(
      { _id: slot._id, status: 'RESERVED', activeReservationId: _id },
      { $set: { status: 'AVAILABLE' }, $unset: { activeReservationId: 1 } }
    );
    if (e?.code === 11000) throw conflict('Slot or vehicle already has an active reservation', 'DUPLICATE_RESERVATION');
    throw e;
  }
  return loadReservation({ _id });
}

export async function cancelReservation(userId, reservationId) {
  await reconcile({ force: true });
  const now = new Date();
  const r = await ParkingReservation.findOneAndUpdate(
    { _id: reservationId, userId, status: 'ACTIVE', expiresAt: { $gt: now } },
    { $set: { status: 'CANCELLED', cancelledAt: now } },
    { new: true }
  );
  if (!r) {
    const cur = await ParkingReservation.findOne({ _id: reservationId, userId });
    if (!cur) throw notFound('Reservation not found'); // also covers other users' reservations
    if (cur.status === 'ACTIVE') {
      await expireReservationById(cur._id, now);
      throw gone('This reservation has already expired', 'RESERVATION_EXPIRED');
    }
    throw conflict(`A ${cur.status.replace('_', ' ').toLowerCase()} reservation cannot be cancelled`, 'NOT_CANCELLABLE');
  }
  await freeSlotForReservation(r);
  return loadReservation({ _id: r._id });
}

/** "I have arrived": server clock decides. Idempotent for retries/double-clicks. */
export async function checkIn(userId, reservationId) {
  const now = new Date();
  let r = await ParkingReservation.findOneAndUpdate(
    { _id: reservationId, userId, status: 'ACTIVE', expiresAt: { $gt: now } }, // deadline enforced in the query itself
    { $set: { status: 'CHECKED_IN', checkedInAt: now } },
    { new: true }
  );
  if (!r) {
    const cur = await ParkingReservation.findOne({ _id: reservationId, userId });
    if (!cur) throw notFound('Reservation not found');
    if (cur.status === 'ACTIVE') {
      await expireReservationById(cur._id, now); // late check-in: expire + release slot
      throw gone('Your 15-minute arrival window has ended. The reservation has expired and the slot was released.', 'RESERVATION_EXPIRED');
    }
    if (cur.status === 'CHECKED_IN') r = cur; // retry path: continue creating/returning the session
    else if (cur.status === 'EXPIRED') throw gone('This reservation has expired', 'RESERVATION_EXPIRED');
    else throw conflict('This reservation was cancelled', 'RESERVATION_CANCELLED');
  }

  let session = await ParkingSession.findOne({ reservationId: r._id });
  if (!session) {
    const vehicle = await Vehicle.findById(r.vehicleId);
    const rate = await getRate(vehicle?.vehicleType || 'CAR');
    try {
      session = await ParkingSession.create({
        sessionNumber: generateReference('SES'),
        userId,
        vehicleId: r.vehicleId,
        registrationNumber: vehicle.registrationNumber,
        vehicleType: vehicle.vehicleType,
        reservationId: r._id,
        slotId: r.slotId,
        arrivalAt: r.checkedInAt, // the official, server-recorded arrival
        ratePerMinute: rate.ratePerMinute, // rate snapshot
        convenienceFee: rate.convenienceFee || 0,
        status: 'ACTIVE',
        open: true,
      });
    } catch (e) {
      if (e?.code !== 11000) throw e;
      session = await ParkingSession.findOne({ reservationId: r._id });
      if (!session) throw conflict('This vehicle or slot already has an open parking session', 'SESSION_CONFLICT');
    }
  }
  await ParkingReservation.updateOne({ _id: r._id, sessionId: { $exists: false } }, { $set: { sessionId: session._id } });
  assertTransition('RESERVED', 'OCCUPIED');
  await ParkingSlot.updateOne(
    { _id: r.slotId, status: 'RESERVED', activeReservationId: r._id },
    { $set: { status: 'OCCUPIED', activeSessionId: session._id }, $unset: { activeReservationId: 1 } }
  );
  return session;
}
