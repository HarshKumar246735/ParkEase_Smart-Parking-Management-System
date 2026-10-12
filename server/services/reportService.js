import Payment from '../models/Payment.js';
import ParkingSession from '../models/ParkingSession.js';
import ParkingReservation from '../models/ParkingReservation.js';
import ParkingSlot from '../models/ParkingSlot.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { availabilitySummary } from './parkingAvailabilityService.js';
import { lastNDayKeys } from '../utils/time.js';

const dayExpr = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field, timezone: env.timezone } });

/** All admin figures are computed from database records at request time. */
export async function buildAdminReport(days = 14) {
  const summary = await availabilitySummary();
  const keys = lastNDayKeys(days);
  const today = keys[keys.length - 1];
  const since = new Date(Date.now() - (days + 1) * 86400000);

  const [rev, ses, vehicleTypes, completedToday, activeReservations, users, totalRevenue] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'SUCCESS', paidAt: { $gte: since } } },
      { $group: { _id: dayExpr('$paidAt'), revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    ParkingSession.aggregate([{ $match: { arrivalAt: { $gte: since } } }, { $group: { _id: dayExpr('$arrivalAt'), sessions: { $sum: 1 } } }]),
    ParkingSession.aggregate([{ $group: { _id: '$vehicleType', value: { $sum: 1 } } }]),
    ParkingSession.aggregate([
      { $match: { status: 'COMPLETED', completedAt: { $gte: new Date(Date.now() - 36 * 3600000) } } },
      { $project: { k: dayExpr('$completedAt') } },
      { $match: { k: today } },
      { $count: 'n' },
    ]),
    ParkingReservation.countDocuments({ status: 'ACTIVE' }),
    User.countDocuments({ role: 'VISITOR' }),
    Payment.aggregate([{ $match: { status: 'SUCCESS' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const revMap = Object.fromEntries(rev.map((r) => [r._id, r]));
  const sesMap = Object.fromEntries(ses.map((r) => [r._id, r]));
  const revenueByDay = keys.map((k) => ({ date: k, revenue: revMap[k]?.revenue || 0, payments: revMap[k]?.count || 0 }));
  const sessionsByDay = keys.map((k) => ({ date: k, sessions: sesMap[k]?.sessions || 0 }));

  return {
    generatedAt: new Date().toISOString(),
    cards: {
      totalSlots: summary.total,
      available: summary.available,
      reserved: summary.reserved,
      occupied: summary.occupied,
      releasePending: summary.releasePending,
      maintenance: summary.maintenance,
      activeSessions: summary.activeSessions,
      activeReservations,
      completedToday: completedToday[0]?.n || 0,
      revenueToday: revMap[today]?.revenue || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers: users,
    },
    charts: {
      occupancyByFloor: summary.byFloor.map((f) => ({
        floor: f.code, name: f.name, available: f.AVAILABLE, reserved: f.RESERVED, occupied: f.OCCUPIED, releasePending: f.RELEASE_PENDING, maintenance: f.MAINTENANCE, total: f.total,
        occupancyPct: f.total ? Math.round(((f.OCCUPIED + f.RESERVED + f.RELEASE_PENDING) / f.total) * 100) : 0,
      })),
      revenueByDay,
      sessionsByDay,
      statusDistribution: Object.entries(summary.byStatus).map(([status, value]) => ({ status, value })),
      vehicleTypeDistribution: vehicleTypes.map((v) => ({ type: v._id, value: v.value })),
    },
  };
}

export async function slotCountsForAdmin() {
  return ParkingSlot.countDocuments();
}
