import ParkingSession from '../models/ParkingSession.js';
import ParkingSlot from '../models/ParkingSlot.js';
import ParkingReservation from '../models/ParkingReservation.js';
import { assertTransition } from '../utils/slotStateMachine.js';
import { freeSlotForReservation } from './reservationExpiryService.js';

export async function freeSlotForSession(session) {
  assertTransition('RELEASE_PENDING', 'AVAILABLE');
  await ParkingSlot.updateOne(
    { _id: session.slotId, status: 'RELEASE_PENDING', activeSessionId: session._id },
    { $set: { status: 'AVAILABLE' }, $unset: { activeSessionId: 1 } }
  );
}

/** Idempotent: PAID -> COMPLETED only once, and only after releaseAt. Slot is freed only if it still belongs to this session. */
export async function releaseSessionById(id, now = new Date()) {
  const s = await ParkingSession.findOneAndUpdate(
    { _id: id, status: 'PAID', releaseAt: { $lte: now } },
    { $set: { status: 'COMPLETED', completedAt: now, open: false } },
    { new: true }
  );
  if (s) await freeSlotForSession(s);
  return s;
}

export async function releaseDueSessions(now = new Date()) {
  const due = await ParkingSession.find({ status: 'PAID', releaseAt: { $lte: now } }).select('_id').limit(500).lean();
  let count = 0;
  for (const d of due) {
    if (await releaseSessionById(d._id, now)) count += 1;
  }
  return count;
}

/**
 * Self-healing for crashes between the two writes of a transition (e.g. the process died after the
 * reservation/session was updated but before the slot was). Only touches slots untouched for 30s
 * so it never races with an in-flight request.
 */
export async function healStaleSlots(now = new Date()) {
  const cutoff = new Date(now.getTime() - 30000);
  const slots = await ParkingSlot.find({ status: { $in: ['RESERVED', 'OCCUPIED', 'RELEASE_PENDING'] }, updatedAt: { $lt: cutoff } }).lean();
  let healed = 0;
  for (const s of slots) {
    if (s.status === 'RESERVED') {
      const r = s.activeReservationId ? await ParkingReservation.findById(s.activeReservationId).lean() : null;
      if (!r || r.status === 'EXPIRED' || r.status === 'CANCELLED') {
        await freeSlotForReservation({ _id: s.activeReservationId, slotId: s._id });
        healed += 1;
      } else if (r.status === 'CHECKED_IN') {
        const sess = await ParkingSession.findOne({ reservationId: r._id }).lean();
        if (sess) {
          assertTransition('RESERVED', 'OCCUPIED');
          await ParkingSlot.updateOne(
            { _id: s._id, status: 'RESERVED', activeReservationId: r._id },
            { $set: { status: 'OCCUPIED', activeSessionId: sess._id }, $unset: { activeReservationId: 1 } }
          );
          healed += 1;
        }
      }
      continue;
    }
    const sess = s.activeSessionId ? await ParkingSession.findById(s.activeSessionId).lean() : null;
    if (!sess || sess.status === 'COMPLETED') {
      // session finished (or vanished) but slot never released
      await ParkingSlot.updateOne(
        { _id: s._id, status: s.status, activeSessionId: s.activeSessionId },
        { $set: { status: 'AVAILABLE' }, $unset: { activeSessionId: 1 } }
      );
      healed += 1;
    } else if (s.status === 'OCCUPIED' && sess.status === 'PAID') {
      assertTransition('OCCUPIED', 'RELEASE_PENDING');
      await ParkingSlot.updateOne({ _id: s._id, status: 'OCCUPIED', activeSessionId: sess._id }, { $set: { status: 'RELEASE_PENDING' } });
      healed += 1;
    }
  }
  return healed;
}
