import ParkingFloor from '../models/ParkingFloor.js';
import ParkingZone from '../models/ParkingZone.js';
import ParkingSlot from '../models/ParkingSlot.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertValid, str } from '../utils/validate.js';
import { SLOT_TYPES } from '../utils/constants.js';
import { listSlots, reconcile } from '../services/parkingAvailabilityService.js';
import { assertTransition } from '../utils/slotStateMachine.js';
import { notFound, conflict, badRequest } from '../utils/ApiError.js';

const CODE_RE = /^[A-Z0-9]{1,4}$/;
const floorDTO = (f) => ({ id: String(f._id), name: f.name, code: f.code, description: f.description, order: f.order, active: f.active });
const zoneDTO = (z) => ({ id: String(z._id), floorId: String(z.floorId?._id ?? z.floorId), floor: z.floorId?.code ? { code: z.floorId.code, name: z.floorId.name } : undefined, name: z.name, code: z.code, description: z.description, active: z.active });
const IN_USE = ['RESERVED', 'OCCUPIED', 'RELEASE_PENDING'];

// ---------- floors ----------
export const adminFloors = asyncHandler(async (req, res) => {
  const floors = await ParkingFloor.find().sort({ order: 1, code: 1 }).lean();
  res.ok({ floors: floors.map(floorDTO) });
});

export const createFloor = asyncHandler(async (req, res) => {
  const name = str(req.body.name);
  const code = str(req.body.code).toUpperCase();
  const errors = {};
  if (!name) errors.name = 'Enter a floor name';
  if (!CODE_RE.test(code)) errors.code = 'Code must be 1-4 letters/numbers (e.g. B2, G, F1)';
  const order = Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0;
  assertValid(errors);
  if (await ParkingFloor.exists({ code })) throw conflict('A floor with this code already exists', 'DUPLICATE');
  const f = await ParkingFloor.create({ name, code, description: str(req.body.description), order, active: true });
  res.ok({ floor: floorDTO(f) }, 201, 'Floor created');
});

export const updateFloor = asyncHandler(async (req, res) => {
  const f = await ParkingFloor.findById(req.params.id);
  if (!f) throw notFound('Floor not found');
  const name = str(req.body.name);
  if (!name) throw badRequest('Enter a floor name', { name: 'Enter a floor name' });
  if (req.body.active === false && f.active) {
    if (await ParkingSlot.exists({ floorId: f._id, status: { $in: IN_USE } })) throw conflict('Slots on this floor are in use. Close the floor once they are free.', 'IN_USE');
  }
  f.name = name;
  f.description = str(req.body.description);
  if (Number.isFinite(Number(req.body.order))) f.order = Number(req.body.order);
  if (typeof req.body.active === 'boolean') f.active = req.body.active;
  await f.save();
  res.ok({ floor: floorDTO(f) }, 200, 'Floor updated');
});

// ---------- zones ----------
export const adminZones = asyncHandler(async (req, res) => {
  const filter = req.query.floorId ? { floorId: req.query.floorId } : {};
  const zones = await ParkingZone.find(filter).populate('floorId', 'name code').sort({ floorId: 1, code: 1 }).lean();
  res.ok({ zones: zones.map(zoneDTO) });
});

export const createZone = asyncHandler(async (req, res) => {
  const name = str(req.body.name);
  const code = str(req.body.code).toUpperCase();
  const errors = {};
  if (!name) errors.name = 'Enter a zone name';
  if (!CODE_RE.test(code)) errors.code = 'Code must be 1-4 letters/numbers (e.g. A, EV, ACC)';
  if (!req.body.floorId) errors.floorId = 'Select a floor';
  assertValid(errors);
  const floor = await ParkingFloor.findById(req.body.floorId);
  if (!floor) throw notFound('Floor not found');
  if (await ParkingZone.exists({ floorId: floor._id, code })) throw conflict('This floor already has a zone with that code', 'DUPLICATE');
  const z = await ParkingZone.create({ floorId: floor._id, name, code, description: str(req.body.description), active: true });
  res.ok({ zone: zoneDTO(await z.populate('floorId', 'name code')) }, 201, 'Zone created');
});

export const updateZone = asyncHandler(async (req, res) => {
  const z = await ParkingZone.findById(req.params.id);
  if (!z) throw notFound('Zone not found');
  const name = str(req.body.name);
  if (!name) throw badRequest('Enter a zone name', { name: 'Enter a zone name' });
  if (req.body.active === false && z.active) {
    if (await ParkingSlot.exists({ zoneId: z._id, status: { $in: IN_USE } })) throw conflict('Slots in this zone are in use. Close the zone once they are free.', 'IN_USE');
  }
  z.name = name;
  z.description = str(req.body.description);
  if (typeof req.body.active === 'boolean') z.active = req.body.active;
  await z.save();
  res.ok({ zone: zoneDTO(await z.populate('floorId', 'name code')) }, 200, 'Zone updated');
});

// ---------- slots ----------
export const adminSlots = asyncHandler(async (req, res) => {
  const slots = await listSlots({ floorId: req.query.floorId, zoneId: req.query.zoneId, status: req.query.status, slotType: req.query.slotType, vehicleType: 'CAR', includeInactive: true });
  res.ok({ slots });
});

export const createSlots = asyncHandler(async (req, res) => {
  const count = Math.floor(Number(req.body.count ?? 1));
  const slotType = req.body.slotType || 'STANDARD';
  const errors = {};
  if (!req.body.zoneId) errors.zoneId = 'Select a zone';
  if (!SLOT_TYPES.includes(slotType)) errors.slotType = 'Choose a slot type';
  if (!(count >= 1 && count <= 50)) errors.count = 'Add between 1 and 50 slots at a time';
  assertValid(errors);
  const zone = await ParkingZone.findById(req.body.zoneId).populate('floorId', 'code');
  if (!zone) throw notFound('Zone not found');
  const existing = await ParkingSlot.find({ zoneId: zone._id }).select('slotNumber').lean();
  let max = 0;
  existing.forEach((s) => { const n = parseInt(s.slotNumber.split('-').pop(), 10); if (n > max) max = n; });
  const docs = Array.from({ length: count }, (_, i) => ({
    slotNumber: `${zone.floorId.code}-${zone.code}-${String(max + i + 1).padStart(2, '0')}`,
    floorId: zone.floorId._id, zoneId: zone._id, slotType, status: 'AVAILABLE',
  }));
  try {
    await ParkingSlot.insertMany(docs);
  } catch (e) {
    if (e?.code === 11000) throw conflict('Some slot numbers already exist. Please retry.', 'DUPLICATE');
    throw e;
  }
  res.ok({ created: docs.map((d) => d.slotNumber) }, 201, `${count} slot${count > 1 ? 's' : ''} added`);
});

export const updateSlot = asyncHandler(async (req, res) => {
  const slotType = req.body.slotType;
  if (!SLOT_TYPES.includes(slotType)) throw badRequest('Choose a slot type', { slotType: 'Choose a slot type' });
  await reconcile({ force: true });
  const slot = await ParkingSlot.findOneAndUpdate({ _id: req.params.id, status: { $in: ['AVAILABLE', 'MAINTENANCE'] } }, { $set: { slotType } }, { new: true });
  if (!slot) {
    if (!(await ParkingSlot.exists({ _id: req.params.id }))) throw notFound('Parking slot not found');
    throw conflict('Slot type can only be changed while the slot is free or in maintenance', 'IN_USE');
  }
  res.ok({ slot: { id: String(slot._id), slotNumber: slot.slotNumber, slotType: slot.slotType, status: slot.status } }, 200, 'Slot updated');
});

export const setMaintenance = asyncHandler(async (req, res) => {
  await reconcile({ force: true });
  assertTransition('AVAILABLE', 'MAINTENANCE');
  const slot = await ParkingSlot.findOneAndUpdate({ _id: req.params.id, status: 'AVAILABLE' }, { $set: { status: 'MAINTENANCE' } }, { new: true });
  if (!slot) {
    const cur = await ParkingSlot.findById(req.params.id);
    if (!cur) throw notFound('Parking slot not found');
    throw conflict(`Only an available slot can be put under maintenance (currently ${cur.status})`, 'IN_USE');
  }
  res.ok({ slot: { id: String(slot._id), slotNumber: slot.slotNumber, status: slot.status } }, 200, 'Slot set to maintenance');
});

export const restoreSlot = asyncHandler(async (req, res) => {
  assertTransition('MAINTENANCE', 'AVAILABLE');
  const slot = await ParkingSlot.findOneAndUpdate(
    { _id: req.params.id, status: 'MAINTENANCE', activeReservationId: { $exists: false }, activeSessionId: { $exists: false } },
    { $set: { status: 'AVAILABLE' } },
    { new: true }
  );
  if (!slot) {
    const cur = await ParkingSlot.findById(req.params.id);
    if (!cur) throw notFound('Parking slot not found');
    throw conflict('Only a slot in maintenance with no active booking can be restored', 'NOT_IN_MAINTENANCE');
  }
  res.ok({ slot: { id: String(slot._id), slotNumber: slot.slotNumber, status: slot.status } }, 200, 'Slot restored to service');
});
