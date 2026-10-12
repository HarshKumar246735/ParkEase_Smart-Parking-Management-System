import ParkingReservation from '../models/ParkingReservation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { reservationDTO, sessionDTO } from '../utils/dto.js';
import { reconcile } from '../services/parkingAvailabilityService.js';
import { createReservation, cancelReservation, checkIn, loadReservation, reservationPopulate } from '../services/reservationService.js';
import { loadSession } from '../services/parkingBillingService.js';
import { getRateMap } from '../services/settingsService.js';
import { assertValid } from '../utils/validate.js';
import { RESERVATION_STATUS } from '../utils/constants.js';
import { notFound, badRequest } from '../utils/ApiError.js';
import mongoose from 'mongoose';

export const create = asyncHandler(async (req, res) => {
  const { vehicleId, slotId } = req.body || {};
  const errors = {};
  if (!mongoose.isValidObjectId(vehicleId)) errors.vehicleId = 'Select a vehicle';
  if (!mongoose.isValidObjectId(slotId)) errors.slotId = 'Select a parking slot';
  assertValid(errors);
  const r = await createReservation(req.user.id, { vehicleId, slotId });
  const rates = await getRateMap();
  res.ok({ reservation: reservationDTO(r, rates[r.vehicleId?.vehicleType]?.ratePerMinute) }, 201, 'Slot reserved. Arrive within the arrival window.');
});

export const mine = asyncHandler(async (req, res) => {
  await reconcile();
  const filter = { userId: req.user.id };
  if (req.query.status) {
    if (!RESERVATION_STATUS.includes(req.query.status)) throw badRequest('Invalid status');
    filter.status = req.query.status;
  }
  const [list, rates] = await Promise.all([
    ParkingReservation.find(filter).sort({ createdAt: -1 }).limit(200).populate(reservationPopulate),
    getRateMap(),
  ]);
  res.ok({ reservations: list.map((r) => reservationDTO(r, rates[r.vehicleId?.vehicleType]?.ratePerMinute)) });
});

export const getOne = asyncHandler(async (req, res) => {
  await reconcile();
  const r = await loadReservation({ _id: req.params.id, userId: req.user.id });
  if (!r) throw notFound('Reservation not found');
  const rates = await getRateMap();
  res.ok({ reservation: reservationDTO(r, rates[r.vehicleId?.vehicleType]?.ratePerMinute) });
});

export const cancel = asyncHandler(async (req, res) => {
  const r = await cancelReservation(req.user.id, req.params.id);
  res.ok({ reservation: reservationDTO(r) }, 200, 'Reservation cancelled');
});

export const arrive = asyncHandler(async (req, res) => {
  const session = await checkIn(req.user.id, req.params.id);
  const full = await loadSession({ _id: session._id });
  res.ok({ session: sessionDTO(full) }, 200, 'Welcome! Your parking session has started.');
});
