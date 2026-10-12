import mongoose from 'mongoose';
import { ROLES } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.VISITOR, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
