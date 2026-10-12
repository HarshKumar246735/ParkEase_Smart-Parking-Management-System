import Payment from '../models/Payment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paymentDTO, sessionDTO } from '../utils/dto.js';
import { payDemo } from '../services/paymentService.js';
import { loadSession } from '../services/parkingBillingService.js';
import { reconcile } from '../services/parkingAvailabilityService.js';
import { buildReceiptHtml } from '../services/receiptService.js';
import { PAYMENT_OPTIONS } from '../utils/paymentOptions.js';
import { parsePage } from '../utils/validate.js';
import { notFound } from '../utils/ApiError.js';

export const options = asyncHandler(async (req, res) => {
  res.ok({ options: PAYMENT_OPTIONS, notice: 'DEMO PAYMENT - No real money will be charged.' });
});

export const createDemo = asyncHandler(async (req, res) => {
  const { payment, session, alreadyPaid } = await payDemo(req.user.id, req.body);
  const full = await loadSession({ _id: session._id });
  res.ok({ payment: paymentDTO(payment), session: sessionDTO(full), alreadyPaid }, alreadyPaid ? 200 : 201, 'Payment successful');
});

export const history = asyncHandler(async (req, res) => {
  await reconcile();
  const { page, limit, skip } = parsePage(req.query, 10);
  const filter = { userId: req.user.id };
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate({ path: 'sessionId', select: 'sessionNumber registrationNumber slotId', populate: { path: 'slotId', select: 'slotNumber' } }),
    Payment.countDocuments(filter),
  ]);
  res.ok({ payments: items.map(paymentDTO), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

export const getOne = asyncHandler(async (req, res) => {
  await reconcile();
  const p = await Payment.findOne({ _id: req.params.id, userId: req.user.id });
  if (!p) throw notFound('Payment not found'); // other users' payments look non-existent
  const session = await loadSession({ _id: p.sessionId });
  res.ok({ payment: paymentDTO(p), session: sessionDTO(session) });
});

export const receipt = asyncHandler(async (req, res) => {
  const html = await buildReceiptHtml(req.params.id, req.user);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="ParkEase-Receipt-${req.params.id}.html"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(html);
});
