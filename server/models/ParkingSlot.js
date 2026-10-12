import mongoose from 'mongoose';
import { SLOT_TYPES, SLOT_STATUS } from '../utils/constants.js';

const slotSchema = new mongoose.Schema(
  {
    slotNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingFloor', required: true },
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingZone', required: true },
    slotType: { type: String, enum: SLOT_TYPES, default: 'STANDARD' },
    status: { type: String, enum: SLOT_STATUS, default: 'AVAILABLE' },
    activeReservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingReservation' },
    activeSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSession' },
  },
  { timestamps: true }
);
slotSchema.index({ zoneId: 1, status: 1 });
slotSchema.index({ floorId: 1, status: 1 });
slotSchema.index({ status: 1, updatedAt: 1 });

export default mongoose.model('ParkingSlot', slotSchema);
