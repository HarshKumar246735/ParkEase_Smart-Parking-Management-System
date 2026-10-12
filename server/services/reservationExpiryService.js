import ParkingReservation from '../models/ParkingReservation.js';
import ParkingSlot from '../models/ParkingSlot.js';
import { assertTransition } from '../utils/slotStateMachine.js';

/** RESERVED -> AVAILABLE for the slot held by this reservation (conditional: never touches a newer holder). */
export async function freeSlotForReservation(reservation) {
  assertTransition('RESERVED', 'AVAILABLE');
  await ParkingSlot.updateOne(
    { _id: reservation.slotId, status: 'RESERVED', activeReservationId: reservation._id },
    { $set: { status: 'AVAILABLE' }, $unset: { activeReservationId: 1 } }
  );
}

/** Idempotent: only an ACTIVE reservation whose deadline has passed can become EXPIRED. */
export async function expireReservationById(id, now = new Date()) {
  const r = await ParkingReservation.findOneAndUpdate(
    { _id: id, status: 'ACTIVE', expiresAt: { $lte: now } },
    { $set: { status: 'EXPIRED', expiredAt: now } },
    { new: true }
  );
  if (r) await freeSlotForReservation(r);
  return r;
}

export async function expireDueReservations(now = new Date()) {
  const due = await ParkingReservation.find({ status: 'ACTIVE', expiresAt: { $lte: now } }).select('_id').limit(500).lean();
  let count = 0;
  for (const d of due) {
    if (await expireReservationById(d._id, now)) count += 1;
  }
  return count;
}
