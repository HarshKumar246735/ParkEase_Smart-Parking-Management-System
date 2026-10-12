import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import ParkingReservation from '../models/ParkingReservation.js';
import ParkingSession from '../models/ParkingSession.js';
import Payment from '../models/Payment.js';
import ParkingRate from '../models/ParkingRate.js';
import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { reservationDTO, sessionDTO, paymentDTO, vehicleDTO } from '../utils/dto.js';
import { reconcile } from '../services/parkingAvailabilityService.js';
import { reservationPopulate } from '../services/reservationService.js';
import { sessionPopulate } from '../services/parkingBillingService.js';
import { getSettings } from '../services/settingsService.js';
import { buildAdminReport } from '../services/reportService.js';
import { parsePage, escapeRegex, str, assertValid } from '../utils/validate.js';
import { dayRange } from '../utils/time.js';
import { VEHICLE_TYPES, RESERVATION_STATUS, SESSION_STATUS, PAYMENT_STATUS } from '../utils/constants.js';
import { badRequest, notFound } from '../utils/ApiError.js';

const pageMeta = (total, page, limit) => ({ total, page, pages: Math.max(1, Math.ceil(total / limit)) });

export const listReservations = asyncHandler(async (req, res) => {
  await reconcile();
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.status) {
    if (!RESERVATION_STATUS.includes(req.query.status)) throw badRequest('Invalid status');
    filter.status = req.query.status;
  }
  if (req.query.q) filter.reservationNumber = { $regex: escapeRegex(str(req.query.q).toUpperCase()) };
  if (req.query.date) {
    const range = dayRange(req.query.date);
    if (!range) throw badRequest('Invalid date (use YYYY-MM-DD)');
    filter.createdAt = { $gte: range[0], $lt: range[1] };
  }
  const sort = req.query.sort === 'deadline' ? { expiresAt: 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    ParkingReservation.find(filter).sort(sort).skip(skip).limit(limit).populate([...reservationPopulate, { path: 'userId', select: 'name email' }]),
    ParkingReservation.countDocuments(filter),
  ]);
  res.ok({ reservations: items.map((r) => reservationDTO(r)), ...pageMeta(total, page, limit) });
});

export const listSessions = asyncHandler(async (req, res) => {
  await reconcile();
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.status) {
    if (!SESSION_STATUS.includes(req.query.status)) throw badRequest('Invalid status');
    filter.status = req.query.status;
  }
  if (req.query.q) {
    const rx = { $regex: escapeRegex(str(req.query.q).toUpperCase().replace(/[\s-]/g, '')) };
    filter.$or = [{ registrationNumber: rx }, { sessionNumber: { $regex: escapeRegex(str(req.query.q).toUpperCase()) } }];
  }
  const [items, total] = await Promise.all([
    ParkingSession.find(filter).sort({ arrivalAt: -1 }).skip(skip).limit(limit).populate([...sessionPopulate, { path: 'userId', select: 'name email' }]),
    ParkingSession.countDocuments(filter),
  ]);
  res.ok({ sessions: items.map((s) => sessionDTO(s)), ...pageMeta(total, page, limit) });
});

/** Read-only: there is intentionally no endpoint that can create or alter a payment status. */
export const listPayments = asyncHandler(async (req, res) => {
  await reconcile();
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.status) {
    if (!PAYMENT_STATUS.includes(req.query.status)) throw badRequest('Invalid status');
    filter.status = req.query.status;
  }
  if (req.query.q) filter.transactionReference = { $regex: escapeRegex(str(req.query.q).toUpperCase()) };
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate([{ path: 'userId', select: 'name email' }, { path: 'sessionId', select: 'sessionNumber registrationNumber slotId', populate: { path: 'slotId', select: 'slotNumber' } }]),
    Payment.countDocuments(filter),
  ]);
  res.ok({ payments: items.map(paymentDTO), ...pageMeta(total, page, limit) });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.q) {
    const rx = { $regex: escapeRegex(str(req.query.q)), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [items, total] = await Promise.all([User.find(filter).select('name email phone role createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(filter)]);
  res.ok({ users: items.map((u) => ({ id: String(u._id), name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt })), ...pageMeta(total, page, limit) });
});

export const getUserDetail = asyncHandler(async (req, res) => {
  await reconcile();
  const user = await User.findById(req.params.id).select('name email phone role createdAt').lean();
  if (!user) throw notFound('User not found');
  const [vehicles, reservations, sessions, payments] = await Promise.all([
    Vehicle.find({ userId: user._id }).lean(),
    ParkingReservation.find({ userId: user._id }).sort({ createdAt: -1 }).limit(25).populate(reservationPopulate),
    ParkingSession.find({ userId: user._id }).sort({ arrivalAt: -1 }).limit(25).populate(sessionPopulate),
    Payment.find({ userId: user._id }).sort({ createdAt: -1 }).limit(25),
  ]);
  res.ok({
    user: { id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt },
    vehicles: vehicles.map((v) => vehicleDTO(v)),
    reservations: reservations.map((r) => reservationDTO(r)),
    sessions: sessions.map((s) => sessionDTO(s)),
    payments: payments.map(paymentDTO),
  });
});

export const getRates = asyncHandler(async (req, res) => {
  const [rates, settings] = await Promise.all([ParkingRate.find().lean(), getSettings()]);
  res.ok({
    rates: VEHICLE_TYPES.map((t) => {
      const r = rates.find((x) => x.vehicleType === t);
      return { vehicleType: t, ratePerMinute: r?.ratePerMinute ?? 2, convenienceFee: r?.convenienceFee ?? 0, active: r?.active ?? true, updatedAt: r?.updatedAt };
    }),
    settings: { arrivalWindowMinutes: settings.arrivalWindowMinutes, releaseDelayMinutes: settings.releaseDelayMinutes, mallName: settings.mallName },
  });
});

export const updateRate = asyncHandler(async (req, res) => {
  const vehicleType = req.params.vehicleType?.toUpperCase();
  if (!VEHICLE_TYPES.includes(vehicleType)) throw badRequest('Unknown vehicle type');
  const ratePerMinute = Number(req.body.ratePerMinute);
  const convenienceFee = Number(req.body.convenienceFee ?? 0);
  const errors = {};
  if (!Number.isFinite(ratePerMinute) || ratePerMinute < 0 || ratePerMinute > 1000) errors.ratePerMinute = 'Enter a rate between 0 and 1000';
  if (!Number.isFinite(convenienceFee) || convenienceFee < 0 || convenienceFee > 1000) errors.convenienceFee = 'Enter a fee between 0 and 1000';
  assertValid(errors);
  // affects NEW sessions only: running sessions keep their rate snapshot
  const rate = await ParkingRate.findOneAndUpdate({ vehicleType }, { $set: { ratePerMinute, convenienceFee, active: true } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  res.ok({ rate: { vehicleType, ratePerMinute: rate.ratePerMinute, convenienceFee: rate.convenienceFee } }, 200, 'Rate updated. Running sessions keep their original rate.');
});

export const updateSettings = asyncHandler(async (req, res) => {
  const arrival = Number(req.body.arrivalWindowMinutes);
  const release = Number(req.body.releaseDelayMinutes);
  const errors = {};
  if (!Number.isInteger(arrival) || arrival < 1 || arrival > 120) errors.arrivalWindowMinutes = 'Enter whole minutes between 1 and 120';
  if (!Number.isInteger(release) || release < 1 || release > 60) errors.releaseDelayMinutes = 'Enter whole minutes between 1 and 60';
  assertValid(errors);
  const $set = { arrivalWindowMinutes: arrival, releaseDelayMinutes: release };
  if (str(req.body.mallName)) $set.mallName = str(req.body.mallName).slice(0, 80);
  await getSettings();
  const s = await Setting.findOneAndUpdate({ key: 'global' }, { $set }, { new: true });
  res.ok({ settings: { arrivalWindowMinutes: s.arrivalWindowMinutes, releaseDelayMinutes: s.releaseDelayMinutes, mallName: s.mallName } }, 200, 'Settings saved. They apply to new reservations and payments.');
});

export const reports = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 30));
  res.ok(await buildAdminReport(days));
});
