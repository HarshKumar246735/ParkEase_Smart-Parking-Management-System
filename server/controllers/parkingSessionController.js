import ParkingSession from '../models/ParkingSession.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sessionDTO } from '../utils/dto.js';
import { reconcile } from '../services/parkingAvailabilityService.js';
import { finalizeSession, loadSession, sessionPopulate } from '../services/parkingBillingService.js';
import { parsePage } from '../utils/validate.js';
import { SESSION_STATUS } from '../utils/constants.js';
import { notFound, conflict, badRequest } from '../utils/ApiError.js';

export const active = asyncHandler(async (req, res) => {
  await reconcile();
  const s = await ParkingSession.findOne({ userId: req.user.id, open: true }).sort({ arrivalAt: -1 }).populate(sessionPopulate);
  res.ok({ session: s ? sessionDTO(s) : null });
});

export const history = asyncHandler(async (req, res) => {
  await reconcile();
  const { page, limit, skip } = parsePage(req.query, 10);
  const filter = { userId: req.user.id };
  if (req.query.status) {
    if (!SESSION_STATUS.includes(req.query.status)) throw badRequest('Invalid status');
    filter.status = req.query.status;
  }
  const dir = req.query.sort === 'oldest' ? 1 : -1;
  const sortField = req.query.sortBy === 'amount' ? 'finalAmount' : 'arrivalAt';
  const [items, total] = await Promise.all([
    ParkingSession.find(filter).sort({ [sortField]: dir }).skip(skip).limit(limit).populate(sessionPopulate),
    ParkingSession.countDocuments(filter),
  ]);
  res.ok({ sessions: items.map((s) => sessionDTO(s)), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

export const getOne = asyncHandler(async (req, res) => {
  await reconcile();
  const s = await loadSession({ _id: req.params.id, userId: req.user.id });
  if (!s) throw notFound('Parking session not found');
  res.ok({ session: sessionDTO(s) });
});

export const bill = asyncHandler(async (req, res) => {
  await reconcile();
  const s = await loadSession({ _id: req.params.id, userId: req.user.id });
  if (!s) throw notFound('Parking session not found');
  if (s.status === 'ACTIVE') throw conflict('The bill is generated when you tap "I\'m leaving"', 'BILL_NOT_FINALIZED');
  res.ok({ session: sessionDTO(s) });
});

export const leave = asyncHandler(async (req, res) => {
  const s = await finalizeSession(req.user.id, req.params.id);
  res.ok({ session: sessionDTO(s) }, 200, 'Your bill is ready');
});
