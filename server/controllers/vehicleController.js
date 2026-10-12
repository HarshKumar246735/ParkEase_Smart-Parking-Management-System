import Vehicle from '../models/Vehicle.js';
import ParkingReservation from '../models/ParkingReservation.js';
import ParkingSession from '../models/ParkingSession.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertValid, str, normalizeRegistration, REG_RE } from '../utils/validate.js';
import { VEHICLE_TYPES } from '../utils/constants.js';
import { vehicleDTO } from '../utils/dto.js';
import { notFound, conflict } from '../utils/ApiError.js';

function parseBody(body) {
  const data = {
    registrationNumber: normalizeRegistration(body.registrationNumber),
    vehicleType: body.vehicleType,
    brand: str(body.brand),
    model: str(body.model),
    color: str(body.color),
    nickname: str(body.nickname),
  };
  const errors = {};
  if (!REG_RE.test(data.registrationNumber)) errors.registrationNumber = 'Enter a valid registration number (4-12 letters/numbers)';
  if (!VEHICLE_TYPES.includes(data.vehicleType)) errors.vehicleType = 'Choose a vehicle type';
  if (!data.brand || data.brand.length > 40) errors.brand = 'Enter the vehicle brand';
  if (!data.model || data.model.length > 40) errors.model = 'Enter the vehicle model';
  if (!data.color || data.color.length > 30) errors.color = 'Enter the vehicle color';
  if (data.nickname.length > 40) errors.nickname = 'Nickname must be 40 characters or fewer';
  assertValid(errors);
  return data;
}

async function statusMap(userId) {
  const [res, ses] = await Promise.all([
    ParkingReservation.find({ userId, status: 'ACTIVE' }).select('vehicleId').lean(),
    ParkingSession.find({ userId, open: true }).select('vehicleId').lean(),
  ]);
  const map = new Map();
  res.forEach((r) => map.set(String(r.vehicleId), 'RESERVED'));
  ses.forEach((s) => map.set(String(s.vehicleId), 'PARKED'));
  return map;
}

async function assertNotBusy(vehicleId) {
  const [r, s] = await Promise.all([
    ParkingReservation.exists({ vehicleId, status: 'ACTIVE' }),
    ParkingSession.exists({ vehicleId, open: true }),
  ]);
  return Boolean(r || s);
}

export const listVehicles = asyncHandler(async (req, res) => {
  const [vehicles, statuses] = await Promise.all([Vehicle.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean(), statusMap(req.user.id)]);
  res.ok({ vehicles: vehicles.map((v) => vehicleDTO(v, statuses.get(String(v._id)) || 'IDLE')) });
});

export const getVehicle = asyncHandler(async (req, res) => {
  const v = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!v) throw notFound('Vehicle not found');
  const statuses = await statusMap(req.user.id);
  res.ok({ vehicle: vehicleDTO(v, statuses.get(String(v._id)) || 'IDLE') });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const data = parseBody(req.body);
  if (await Vehicle.exists({ userId: req.user.id, registrationNumber: data.registrationNumber })) {
    throw conflict('You have already added this vehicle', 'DUPLICATE_VEHICLE');
  }
  let v;
  try {
    v = await Vehicle.create({ ...data, userId: req.user.id });
  } catch (e) {
    if (e?.code === 11000) throw conflict('You have already added this vehicle', 'DUPLICATE_VEHICLE');
    throw e;
  }
  res.ok({ vehicle: vehicleDTO(v, 'IDLE') }, 201, 'Vehicle added');
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const v = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
  if (!v) throw notFound('Vehicle not found');
  const data = parseBody(req.body);
  const busy = await assertNotBusy(v._id);
  if (busy && (data.vehicleType !== v.vehicleType || data.registrationNumber !== v.registrationNumber)) {
    throw conflict('Registration number and type cannot be changed while the vehicle is reserved or parked', 'VEHICLE_BUSY');
  }
  if (data.registrationNumber !== v.registrationNumber && (await Vehicle.exists({ userId: req.user.id, registrationNumber: data.registrationNumber, _id: { $ne: v._id } }))) {
    throw conflict('You have already added this vehicle', 'DUPLICATE_VEHICLE');
  }
  Object.assign(v, data);
  await v.save();
  res.ok({ vehicle: vehicleDTO(v, busy ? 'BUSY' : 'IDLE') }, 200, 'Vehicle updated');
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const v = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
  if (!v) throw notFound('Vehicle not found');
  if (await assertNotBusy(v._id)) throw conflict('This vehicle has an active reservation or parking session and cannot be deleted', 'VEHICLE_BUSY');
  await v.deleteOne();
  res.ok({ id: req.params.id }, 200, 'Vehicle removed');
});
