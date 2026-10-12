import ParkingSlot from '../models/ParkingSlot.js';
import ParkingSession from '../models/ParkingSession.js';
import { expireDueReservations } from './reservationExpiryService.js';
import { releaseDueSessions, healStaleSlots } from './slotReleaseService.js';
import { healSuccessfulPayments } from './paymentService.js';
import { getRateMap } from './settingsService.js';
import { SLOT_STATUS } from '../utils/constants.js';

let running = null;
let lastRun = 0;
let lastHeal = 0;

/**
 * Reconciliation = the safety net behind the schedulers. It is called by the interval jobs AND before
 * every availability read / reservation / check-in, so even if Render slept or a tick was missed,
 * overdue reservations and release-pending slots are corrected on the first request after the deadline.
 * Every step is idempotent, so overlapping runs are harmless.
 */
export async function reconcile({ force = false } = {}) {
  if (running) {
    await running;
    if (!force) return;
  }
  const t = Date.now();
  if (!force && t - lastRun < 1000) return;
  lastRun = t;
  running = (async () => {
    try {
      const now = new Date();
      await expireDueReservations(now);
      await releaseDueSessions(now);
      if (force || t - lastHeal > 10000) {
        lastHeal = t;
        await healSuccessfulPayments(now);
        await healStaleSlots(now);
      }
    } catch (err) {
      console.error('[reconcile] failed:', err.message);
    }
  })();
  try {
    await running;
  } finally {
    running = null;
  }
}

const idOf = (d) => (d ? String(d._id ?? d) : null);

export function toSlotDTO(slot, rateMap = {}, vehicleType) {
  const rate = vehicleType ? rateMap[vehicleType] : null;
  const compatible = vehicleType ? !(slot.slotType === 'EV_CHARGING' && vehicleType !== 'ELECTRIC') : true;
  return {
    id: idOf(slot),
    slotNumber: slot.slotNumber,
    slotType: slot.slotType,
    status: slot.status,
    floor: slot.floorId && slot.floorId._id ? { id: idOf(slot.floorId), code: slot.floorId.code, name: slot.floorId.name } : { id: idOf(slot.floorId) },
    zone: slot.zoneId && slot.zoneId._id ? { id: idOf(slot.zoneId), code: slot.zoneId.code, name: slot.zoneId.name } : { id: idOf(slot.zoneId) },
    ratePerMinute: rate ? rate.ratePerMinute : null,
    convenienceFee: rate ? rate.convenienceFee : null,
    compatible,
  };
}

export async function listSlots({ floorId, zoneId, slotType, status, vehicleType, limit, includeInactive = false } = {}) {
  await reconcile();
  const filter = {};
  if (floorId) filter.floorId = floorId;
  if (zoneId) filter.zoneId = zoneId;
  if (slotType) filter.slotType = slotType;
  if (status) filter.status = status;
  let q = ParkingSlot.find(filter)
    .sort({ slotNumber: 1 })
    .populate('floorId', 'name code active')
    .populate('zoneId', 'name code active');
  if (limit) q = q.limit(limit);
  const [slots, rateMap] = await Promise.all([q.lean(), getRateMap()]);
  return slots
    .filter((s) => includeInactive || (s.floorId?.active !== false && s.zoneId?.active !== false))
    .map((s) => toSlotDTO(s, rateMap, vehicleType));
}

export async function availabilitySummary() {
  await reconcile();
  const [byStatus, byFloor, activeSessions] = await Promise.all([
    ParkingSlot.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    ParkingSlot.aggregate([
      { $group: { _id: { floorId: '$floorId', status: '$status' }, n: { $sum: 1 } } },
      { $lookup: { from: 'parkingfloors', localField: '_id.floorId', foreignField: '_id', as: 'floor' } },
      { $unwind: '$floor' },
      { $match: { 'floor.active': true } },
    ]),
    ParkingSession.countDocuments({ status: 'ACTIVE' }),
  ]);
  const counts = Object.fromEntries(SLOT_STATUS.map((s) => [s, 0]));
  byStatus.forEach((r) => { counts[r._id] = r.n; });
  const floors = {};
  byFloor.forEach((r) => {
    const key = String(r._id.floorId);
    floors[key] ||= { id: key, code: r.floor.code, name: r.floor.name, order: r.floor.order ?? 0, total: 0, ...Object.fromEntries(SLOT_STATUS.map((s) => [s, 0])) };
    floors[key][r._id.status] += r.n;
    floors[key].total += r.n;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return {
    total,
    available: counts.AVAILABLE,
    reserved: counts.RESERVED,
    occupied: counts.OCCUPIED,
    releasePending: counts.RELEASE_PENDING,
    maintenance: counts.MAINTENANCE,
    activeSessions,
    byStatus: counts,
    byFloor: Object.values(floors).sort((a, b) => a.order - b.order),
  };
}
