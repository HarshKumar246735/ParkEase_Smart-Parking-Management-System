import Payment from '../models/Payment.js';
import ParkingSession from '../models/ParkingSession.js';
import ParkingSlot from '../models/ParkingSlot.js';
import { getSettings } from './settingsService.js';
import { generateReference } from '../utils/generateReference.js';
import { assertTransition } from '../utils/slotStateMachine.js';
import { PAYMENT_OPTIONS, PAYMENT_METHODS } from '../utils/paymentOptions.js';
import { badRequest, notFound, conflict } from '../utils/ApiError.js';

const ALLOWED_BODY_KEYS = new Set(['sessionId', 'method', 'provider']);

/**
 * Applies a SUCCESSFUL payment to its session + slot. Safe to call repeatedly (every write is conditional),
 * which is what makes retries and the reconciliation healer correct.
 */
export async function settleSession(payment) {
  const settings = await getSettings();
  const releaseAt = new Date(payment.paidAt.getTime() + settings.releaseDelayMinutes * 60000);
  // PAYMENT_PENDING -> PAID (once)
  await ParkingSession.findOneAndUpdate(
    { _id: payment.sessionId, status: 'PAYMENT_PENDING' },
    { $set: { status: 'PAID', paymentId: payment._id, paymentSuccessTimestamp: payment.paidAt, releaseAt } }
  );
  const session = await ParkingSession.findById(payment.sessionId);
  if (session && session.status === 'PAID') {
    assertTransition('OCCUPIED', 'RELEASE_PENDING');
    await ParkingSlot.updateOne({ _id: session.slotId, status: 'OCCUPIED', activeSessionId: session._id }, { $set: { status: 'RELEASE_PENDING' } });
  }
  return session;
}

export function validatePaymentBody(body) {
  if (!body || typeof body !== 'object') throw badRequest('Invalid payment request');
  const extra = Object.keys(body).filter((k) => !ALLOWED_BODY_KEYS.has(k));
  if (extra.length) throw badRequest('Payment credentials must never be sent to the server. Only the payment method is required.');
  const errors = {};
  if (!PAYMENT_METHODS.includes(body.method)) errors.method = 'Choose a valid payment method';
  else if (!PAYMENT_OPTIONS[body.method].includes(body.provider)) errors.provider = 'Choose a valid option for this payment method';
  if (Object.keys(errors).length) throw badRequest('Please choose a valid demo payment method', errors);
}

export async function payDemo(userId, body) {
  validatePaymentBody(body);
  // ownership check: another user's session is reported as not found
  const session = await ParkingSession.findOne({ _id: body.sessionId, userId });
  if (!session) throw notFound('Parking session not found');

  let payment = await Payment.findOne({ sessionId: session._id });
  if (payment?.status === 'SUCCESS') {
    // idempotent retry / double-click: never a second charge
    await settleSession(payment);
    return { payment, session: await ParkingSession.findById(session._id), alreadyPaid: true };
  }
  if (session.status === 'ACTIVE') throw conflict('Finish parking with "I\'m leaving" to generate your bill first', 'BILL_NOT_FINALIZED');
  if (session.status !== 'PAYMENT_PENDING') throw conflict('This invoice has already been settled', 'ALREADY_SETTLED');

  if (!payment) {
    try {
      payment = await Payment.create({
        transactionReference: generateReference('TXN'),
        receiptNumber: generateReference('RCP'),
        invoiceNumber: session.invoiceNumber,
        userId,
        sessionId: session._id,
        amount: session.finalAmount, // authoritative amount from DB - never from the client
        method: body.method,
        provider: body.provider,
        status: 'PENDING',
        demoMode: true,
      });
    } catch (e) {
      if (e?.code !== 11000) throw e;
      payment = await Payment.findOne({ sessionId: session._id });
    }
  }

  // PENDING/FAILED -> SUCCESS exactly once (atomic); a concurrent request that loses gets the stored result
  const now = new Date();
  const won = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $in: ['PENDING', 'FAILED'] } },
    { $set: { status: 'SUCCESS', paidAt: now, method: body.method, provider: body.provider } },
    { new: true }
  );
  payment = won || (await Payment.findById(payment._id));
  if (payment.status !== 'SUCCESS') throw conflict('Payment could not be completed. Please try again.', 'PAYMENT_NOT_COMPLETED');

  await settleSession(payment);
  return { payment, session: await ParkingSession.findById(session._id), alreadyPaid: Boolean(!won) };
}

/** Heals payments that succeeded but whose session transition did not complete (crash between writes). */
export async function healSuccessfulPayments(now = new Date()) {
  const since = new Date(now.getTime() - 6 * 3600 * 1000);
  const payments = await Payment.find({ status: 'SUCCESS', paidAt: { $gte: since } }).limit(200);
  if (!payments.length) return 0;
  const pending = await ParkingSession.find({ _id: { $in: payments.map((p) => p.sessionId) }, status: 'PAYMENT_PENDING' }).select('_id').lean();
  const ids = new Set(pending.map((s) => String(s._id)));
  let n = 0;
  for (const p of payments) {
    if (ids.has(String(p.sessionId))) {
      await settleSession(p);
      n += 1;
    }
  }
  return n;
}
