import mongoose from 'mongoose';
import { DEFAULTS } from '../utils/constants.js';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    arrivalWindowMinutes: { type: Number, default: DEFAULTS.arrivalWindowMinutes, min: 1, max: 120 },
    releaseDelayMinutes: { type: Number, default: DEFAULTS.releaseDelayMinutes, min: 1, max: 60 },
    mallName: { type: String, default: 'ParkEase Mall', trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
