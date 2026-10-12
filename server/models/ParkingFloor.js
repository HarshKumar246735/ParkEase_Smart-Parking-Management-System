import mongoose from 'mongoose';

const floorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 4 },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('ParkingFloor', floorSchema);
