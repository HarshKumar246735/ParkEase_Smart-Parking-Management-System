import Setting from '../models/Setting.js';
import ParkingRate from '../models/ParkingRate.js';
import { DEFAULTS } from '../utils/constants.js';

export async function getSettings() {
  try {
    return await Setting.findOneAndUpdate({ key: 'global' }, { $setOnInsert: { key: 'global' } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  } catch (e) {
    if (e?.code === 11000) return Setting.findOne({ key: 'global' }).lean();
    throw e;
  }
}

/** Current rate for a vehicle type. Falls back to the documented default (Rs 2/min) if never configured. */
export async function getRate(vehicleType) {
  try {
    return await ParkingRate.findOneAndUpdate(
      { vehicleType },
      { $setOnInsert: { vehicleType, ratePerMinute: DEFAULTS.ratePerMinute, convenienceFee: 0, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  } catch (e) {
    if (e?.code === 11000) return ParkingRate.findOne({ vehicleType }).lean();
    throw e;
  }
}

export async function getRateMap() {
  const rates = await ParkingRate.find().lean();
  return Object.fromEntries(rates.map((r) => [r.vehicleType, r]));
}
