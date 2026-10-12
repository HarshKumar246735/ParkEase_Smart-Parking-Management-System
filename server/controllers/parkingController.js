import ParkingFloor from '../models/ParkingFloor.js';
import ParkingZone from '../models/ParkingZone.js';
import ParkingSlot from '../models/ParkingSlot.js';
import ParkingRate from '../models/ParkingRate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listSlots, availabilitySummary, toSlotDTO, reconcile } from '../services/parkingAvailabilityService.js';
import { getSettings, getRateMap } from '../services/settingsService.js';
import { VEHICLE_TYPES, SLOT_TYPES, SLOT_STATUS, SLOT_STATUS as _S } from '../utils/constants.js';
import { badRequest, notFound } from '../utils/ApiError.js';

const countsByStatus = (rows) => {
  const out = { total: 0, ...Object.fromEntries(_S.map((s) => [s, 0])) };
  rows.forEach((r) => { out[r.status] = r.n; out.total += r.n; });
  return out;
};

export const getFloors = asyncHandler(async (req, res) => {
  await reconcile();
  const [floors, agg] = await Promise.all([
    ParkingFloor.find({ active: true }).sort({ order: 1, code: 1 }).lean(),
    ParkingSlot.aggregate([{ $group: { _id: { f: '$floorId', status: '$status' }, n: { $sum: 1 } } }]),
  ]);
  res.ok({
    floors: floors.map((f) => ({
      id: String(f._id), name: f.name, code: f.code, description: f.description,
      counts: countsByStatus(agg.filter((a) => String(a._id.f) === String(f._id)).map((a) => ({ status: a._id.status, n: a.n }))),
    })),
  });
});

export const getZonesForFloor = asyncHandler(async (req, res) => {
  await reconcile();
  const floor = await ParkingFloor.findOne({ _id: req.params.id, active: true }).lean();
  if (!floor) throw notFound('Floor not found');
  const [zones, agg] = await Promise.all([
    ParkingZone.find({ floorId: floor._id, active: true }).sort({ code: 1 }).lean(),
    ParkingSlot.aggregate([{ $match: { floorId: floor._id } }, { $group: { _id: { z: '$zoneId', status: '$status' }, n: { $sum: 1 } } }]),
  ]);
  res.ok({
    zones: zones.map((z) => ({
      id: String(z._id), floorId: String(z.floorId), name: z.name, code: z.code, description: z.description,
      counts: countsByStatus(agg.filter((a) => String(a._id.z) === String(z._id)).map((a) => ({ status: a._id.status, n: a.n }))),
    })),
  });
});

function parseSlotQuery(q) {
  const out = {};
  if (q.floorId) out.floorId = q.floorId;
  if (q.zoneId) out.zoneId = q.zoneId;
  if (q.vehicleType) {
    if (!VEHICLE_TYPES.includes(q.vehicleType)) throw badRequest('Invalid vehicleType');
    out.vehicleType = q.vehicleType;
  }
  if (q.slotType) {
    if (!SLOT_TYPES.includes(q.slotType)) throw badRequest('Invalid slotType');
    out.slotType = q.slotType;
  }
  if (q.status) {
    if (!SLOT_STATUS.includes(q.status)) throw badRequest('Invalid status');
    out.status = q.status;
  }
  const limit = parseInt(q.limit, 10);
  if (limit > 0) out.limit = Math.min(limit, 500);
  return out;
}

export const getSlotsForZone = asyncHandler(async (req, res) => {
  const slots = await listSlots({ ...parseSlotQuery(req.query), zoneId: req.params.id });
  res.ok({ slots });
});

export const getSlots = asyncHandler(async (req, res) => {
  res.ok({ slots: await listSlots(parseSlotQuery(req.query)) });
});

export const getSlot = asyncHandler(async (req, res) => {
  await reconcile();
  const slot = await ParkingSlot.findById(req.params.id).populate('floorId', 'name code').populate('zoneId', 'name code').lean();
  if (!slot) throw notFound('Parking slot not found');
  res.ok({ slot: toSlotDTO(slot, await getRateMap(), parseSlotQuery(req.query).vehicleType) });
});

export const getAvailability = asyncHandler(async (req, res) => {
  res.ok(await availabilitySummary());
});

/** Public pricing + rules (used by the landing page and booking modal). */
export const getRates = asyncHandler(async (req, res) => {
  const [rates, settings] = await Promise.all([ParkingRate.find({ active: true }).lean(), getSettings()]);
  res.ok({
    rates: VEHICLE_TYPES.map((t) => {
      const r = rates.find((x) => x.vehicleType === t);
      return { vehicleType: t, ratePerMinute: r?.ratePerMinute ?? 2, convenienceFee: r?.convenienceFee ?? 0 };
    }),
    arrivalWindowMinutes: settings.arrivalWindowMinutes,
    releaseDelayMinutes: settings.releaseDelayMinutes,
    mallName: settings.mallName,
    rounding: 'Parking time is rounded up to the next full minute (minimum 1 minute).',
  });
});
