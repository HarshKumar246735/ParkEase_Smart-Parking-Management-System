import ParkingSession from '../models/ParkingSession.js';
import { computeCharges } from '../utils/billing.js';
import { generateReference } from '../utils/generateReference.js';
import { notFound, conflict } from '../utils/ApiError.js';
import { reconcile } from './parkingAvailabilityService.js';

export const sessionPopulate = [
  { path: 'slotId', select: 'slotNumber slotType status floorId zoneId', populate: [{ path: 'floorId', select: 'name code' }, { path: 'zoneId', select: 'name code' }] },
];

export async function loadSession(filter) {
  return ParkingSession.findOne(filter).populate(sessionPopulate);
}

/**
 * "I'm leaving": freezes the bill. The ACTIVE -> PAYMENT_PENDING update is conditional, so repeated or
 * concurrent clicks return the very same finalized invoice instead of re-calculating a higher one.
 */
export async function finalizeSession(userId, sessionId) {
  const session = await ParkingSession.findOne({ _id: sessionId, userId });
  if (!session) throw notFound('Parking session not found');
  if (session.status !== 'ACTIVE') {
    if (session.status === 'PAYMENT_PENDING') return loadSession({ _id: session._id });
    throw conflict('This parking session has already been paid', 'ALREADY_SETTLED');
  }
  const now = new Date();
  const charges = computeCharges({
    arrivalAt: session.arrivalAt,
    endAt: now,
    ratePerMinute: session.ratePerMinute,
    convenienceFee: session.convenienceFee,
    discount: 0,
  });
  await ParkingSession.findOneAndUpdate(
    { _id: session._id, userId, status: 'ACTIVE' },
    {
      $set: {
        status: 'PAYMENT_PENDING',
        departureAt: now,
        billableMinutes: charges.billableMinutes,
        parkingCharge: charges.parkingCharge,
        convenienceFee: charges.convenienceFee,
        discount: charges.discount,
        finalAmount: charges.finalAmount,
        invoiceNumber: generateReference('INV'),
      },
    }
  );
  await reconcile();
  return loadSession({ _id: session._id });
}
