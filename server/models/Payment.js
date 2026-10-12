import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../utils/constants.js';
import { PAYMENT_METHODS } from '../utils/paymentOptions.js';

/** NOTE: only the method label is stored. Card numbers, CVVs, UPI IDs and bank credentials are never accepted or stored. */
const paymentSchema = new mongoose.Schema(
  {
    transactionReference: { type: String, required: true, unique: true },
    receiptNumber: { type: String, required: true, unique: true },
    invoiceNumber: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // unique => at most ONE payment per finalized invoice/session (duplicate-payment guard)
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSession', required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    provider: { type: String, required: true },
    status: { type: String, enum: PAYMENT_STATUS, default: 'PENDING' },
    demoMode: { type: Boolean, default: true },
    paidAt: Date,
  },
  { timestamps: true }
);
paymentSchema.index({ status: 1, paidAt: -1 });

export default mongoose.model('Payment', paymentSchema);
