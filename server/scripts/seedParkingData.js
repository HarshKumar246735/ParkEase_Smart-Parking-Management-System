/* Seeds floors, zones, 74 slots, rates, settings and an optional demo visitor. Idempotent: re-running adds nothing twice. */
import bcrypt from 'bcryptjs';
import { assertEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import ParkingFloor from '../models/ParkingFloor.js';
import ParkingZone from '../models/ParkingZone.js';
import ParkingSlot from '../models/ParkingSlot.js';
import ParkingRate from '../models/ParkingRate.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { VEHICLE_TYPES } from '../utils/constants.js';

const LAYOUT = [
  { code: 'B2', name: 'Basement 2', order: 1, zones: [{ code: 'A', name: 'Zone A', count: 8 }, { code: 'B', name: 'Zone B', count: 8 }] },
  { code: 'B1', name: 'Basement 1', order: 2, zones: [{ code: 'A', name: 'Zone A', count: 8 }, { code: 'B', name: 'Zone B', count: 8 }, { code: 'EV', name: 'EV Zone', count: 6, type: 'EV_CHARGING' }] },
  { code: 'G', name: 'Ground Floor', order: 3, zones: [{ code: 'A', name: 'Zone A', count: 8, premium: 3 }, { code: 'B', name: 'Zone B', count: 8 }, { code: 'ACC', name: 'Accessible Parking Zone', count: 4, type: 'ACCESSIBLE' }] },
  { code: 'F1', name: 'First Floor', order: 4, zones: [{ code: 'A', name: 'Zone A', count: 8 }, { code: 'C', name: 'Zone C', count: 8 }] },
];

async function run() {
  assertEnv();
  await connectDB();
  let createdSlots = 0;
  for (const f of LAYOUT) {
    const floor = await ParkingFloor.findOneAndUpdate({ code: f.code }, { $setOnInsert: { code: f.code, name: f.name, order: f.order, description: `${f.name} parking`, active: true } }, { upsert: true, new: true });
    for (const z of f.zones) {
      const zone = await ParkingZone.findOneAndUpdate({ floorId: floor._id, code: z.code }, { $setOnInsert: { floorId: floor._id, code: z.code, name: z.name, description: '', active: true } }, { upsert: true, new: true });
      for (let i = 1; i <= z.count; i += 1) {
        const slotNumber = `${f.code}-${z.code}-${String(i).padStart(2, '0')}`;
        const slotType = z.type || (z.premium && i <= z.premium ? 'PREMIUM' : 'STANDARD');
        const res = await ParkingSlot.updateOne({ slotNumber }, { $setOnInsert: { slotNumber, floorId: floor._id, zoneId: zone._id, slotType, status: 'AVAILABLE' } }, { upsert: true });
        if (res.upsertedCount) createdSlots += 1;
      }
    }
  }
  for (const vehicleType of VEHICLE_TYPES) {
    await ParkingRate.updateOne({ vehicleType }, { $setOnInsert: { vehicleType, ratePerMinute: 2, convenienceFee: 0, active: true } }, { upsert: true });
  }
  await Setting.updateOne({ key: 'global' }, { $setOnInsert: { key: 'global', arrivalWindowMinutes: 15, releaseDelayMinutes: 2, mallName: process.env.MALL_NAME || 'ParkEase Mall' } }, { upsert: true });

  const { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } = process.env;
  if (DEMO_USER_EMAIL && DEMO_USER_PASSWORD) {
    const email = DEMO_USER_EMAIL.toLowerCase().trim();
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name: 'Demo Visitor', email, phone: '9876543210', passwordHash: await bcrypt.hash(DEMO_USER_PASSWORD, 12), role: 'VISITOR' });
      console.log(`[seed:data] demo visitor created: ${email}`);
    }
    await Vehicle.updateOne({ userId: user._id, registrationNumber: 'DL8CAB1234' }, { $setOnInsert: { userId: user._id, registrationNumber: 'DL8CAB1234', vehicleType: 'CAR', brand: 'Hyundai', model: 'Creta', color: 'White', nickname: 'Daily driver' } }, { upsert: true });
    await Vehicle.updateOne({ userId: user._id, registrationNumber: 'DL3SEV0007' }, { $setOnInsert: { userId: user._id, registrationNumber: 'DL3SEV0007', vehicleType: 'ELECTRIC', brand: 'Tata', model: 'Nexon EV', color: 'Blue', nickname: 'Weekend EV' } }, { upsert: true });
  }
  console.log(`[seed:data] done. New slots created this run: ${createdSlots}. Total slots: ${await ParkingSlot.countDocuments()}`);
}
run().catch((e) => { console.error('[seed:data] failed:', e.message); process.exitCode = 1; }).finally(() => disconnectDB());
