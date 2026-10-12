import ParkingSession from '../models/ParkingSession.js';
import ParkingReservation from '../models/ParkingReservation.js';
import Payment from '../models/Payment.js';
import Vehicle from '../models/Vehicle.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sessionDTO, reservationDTO, paymentDTO, vehicleDTO } from '../utils/dto.js';
import { reconcile, availabilitySummary } from '../services/parkingAvailabilityService.js';
import { sessionPopulate } from '../services/parkingBillingService.js';
import { reservationPopulate } from '../services/reservationService.js';
import { buildAdminReport } from '../services/reportService.js';

export const userDashboard = asyncHandler(async (req, res) => {
  await reconcile();
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const [totalSessions, activeReservations, activeSession, spent, recentPayments, recentSessions, availability, vehicleCount] = await Promise.all([
    ParkingSession.countDocuments({ userId }),
    ParkingReservation.find({ userId, status: 'ACTIVE' }).populate(reservationPopulate),
    ParkingSession.findOne({ userId, open: true }).populate(sessionPopulate),
    Payment.aggregate([{ $match: { userId, status: 'SUCCESS' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Payment.find({ userId, status: 'SUCCESS' }).sort({ paidAt: -1 }).limit(5),
    ParkingSession.find({ userId }).sort({ arrivalAt: -1 }).limit(10).select('vehicleId'),
    availabilitySummary(),
    Vehicle.countDocuments({ userId }),
  ]);
  const recentIds = [...new Set(recentSessions.map((s) => String(s.vehicleId)))].slice(0, 4);
  const recentVehicles = recentIds.length ? await Vehicle.find({ _id: { $in: recentIds }, userId }).lean() : [];
  res.ok({
    user: { name: req.user.name },
    stats: { totalSessions, activeReservations: activeReservations.length, totalSpent: spent[0]?.total || 0, successfulPayments: spent[0]?.count || 0, vehicles: vehicleCount },
    activeReservations: activeReservations.map((r) => reservationDTO(r)),
    activeSession: activeSession ? sessionDTO(activeSession) : null,
    recentPayments: recentPayments.map(paymentDTO),
    recentVehicles: recentVehicles.map((v) => vehicleDTO(v)),
    availability: { total: availability.total, available: availability.available, occupied: availability.occupied, reserved: availability.reserved, releasePending: availability.releasePending },
  });
});

export const adminDashboard = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 14));
  res.ok(await buildAdminReport(days));
});
