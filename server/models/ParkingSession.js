import mongoose from 'mongoose';
import { SESSION_STATUS, VEHICLE_TYPES } from '../utils/constants.js';

const sessionSchema = new mongoose.Schema(
  {
    sessionNumber: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    // snapshots so history survives vehicle deletion
    registrationNumber: { type: String, required: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingReservation', required: true, unique: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot', required: true },
    arrivalAt: { type: Date, required: true },
    departureAt: Date,
    // rate snapshot taken at check-in: later admin changes never affect this session
    ratePerMinute: { type: Number, required: true, min: 0 },
    convenienceFee: { type: Number, default: 0, min: 0 },
    billableMinutes: Number,
    parkingCharge: Number,
    discount: { type: Number, default: 0 },
    finalAmount: Number,
    invoiceNumber: { type: String, unique: true, sparse: true },
    status: { type: String, enum: SESSION_STATUS, default: 'ACTIVE' },
    open: { type: Boolean, default: true }, // true until COMPLETED
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    paymentSuccessTimestamp: Date,
    releaseAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

sessionSchema.index({ vehicleId: 1 }, { unique: true, partialFilterExpression: { open: { $eq: true } } });
sessionSchema.index({ slotId: 1 }, { unique: true, partialFilterExpression: { open: { $eq: true } } });
sessionSchema.index({ status: 1, releaseAt: 1 });
sessionSchema.index({ userId: 1, arrivalAt: -1 });

export default mongoose.model('ParkingSession', sessionSchema);
