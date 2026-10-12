import mongoose from 'mongoose';
import { VEHICLE_TYPES } from '../utils/constants.js';

const vehicleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    registrationNumber: { type: String, required: true, uppercase: true, trim: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    brand: { type: String, required: true, trim: true, maxlength: 40 },
    model: { type: String, required: true, trim: true, maxlength: 40 },
    color: { type: String, required: true, trim: true, maxlength: 30 },
    nickname: { type: String, trim: true, maxlength: 40, default: '' },
  },
  { timestamps: true }
);
vehicleSchema.index({ userId: 1, registrationNumber: 1 }, { unique: true });

export default mongoose.model('Vehicle', vehicleSchema);
