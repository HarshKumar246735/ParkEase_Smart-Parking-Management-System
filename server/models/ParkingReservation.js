import mongoose from 'mongoose';
import { RESERVATION_STATUS } from '../utils/constants.js';

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot', required: true },
    expiresAt: { type: Date, required: true },
    checkedInAt: Date,
    cancelledAt: Date,
    expiredAt: Date,
    status: { type: String, enum: RESERVATION_STATUS, default: 'ACTIVE' },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSession' },
  },
  { timestamps: true }
);

// A slot / a vehicle can have at most ONE active reservation at any time (race-condition guard).
reservationSchema.index({ slotId: 1 }, { unique: true, partialFilterExpression: { status: { $eq: 'ACTIVE' } } });
reservationSchema.index({ vehicleId: 1 }, { unique: true, partialFilterExpression: { status: { $eq: 'ACTIVE' } } });
reservationSchema.index({ status: 1, expiresAt: 1 });
reservationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('ParkingReservation', reservationSchema);
