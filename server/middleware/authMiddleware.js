import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { unauthorized } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Verifies the JWT and loads the user (and role) from the database. The role is never taken from the client. */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.');
  }
  const user = await User.findById(payload.sub).select('name email phone role createdAt').lean();
  if (!user) throw unauthorized('Account no longer exists');
  req.user = { id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt };
  next();
});

export const signToken = (userId) => jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
