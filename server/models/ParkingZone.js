import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema(
  {
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingFloor', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 4 },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
zoneSchema.index({ floorId: 1, code: 1 }, { unique: true });

export default mongoose.model('ParkingZone', zoneSchema);
