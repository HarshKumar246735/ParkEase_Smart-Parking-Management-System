import mongoose from 'mongoose';
import { VEHICLE_TYPES } from '../utils/constants.js';

const rateSchema = new mongoose.Schema(
  {
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true, unique: true },
    ratePerMinute: { type: Number, required: true, min: 0, max: 10000 },
    convenienceFee: { type: Number, default: 0, min: 0, max: 10000 },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model('ParkingRate', rateSchema);
