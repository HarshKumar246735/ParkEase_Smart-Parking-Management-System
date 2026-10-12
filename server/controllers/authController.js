import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertValid, str, EMAIL_RE, PHONE_RE, normalizePhone, passwordProblem } from '../utils/validate.js';
import { conflict, unauthorized } from '../utils/ApiError.js';

const publicUser = (u) => ({ id: String(u._id), name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt });
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', 10);

export const register = asyncHandler(async (req, res) => {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();
  const phone = normalizePhone(req.body.phone);
  const { password, confirmPassword } = req.body;
  const errors = {};
  if (name.length < 2 || name.length > 80) errors.name = 'Enter your full name (2-80 characters)';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (!PHONE_RE.test(phone)) errors.phone = 'Enter a valid phone number (10-13 digits)';
  const pw = passwordProblem(password);
  if (pw) errors.password = pw;
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  assertValid(errors);

  if (await User.exists({ email })) throw conflict('An account with this email already exists', 'EMAIL_TAKEN');
  let user;
  try {
    user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 12), role: 'VISITOR' });
  } catch (e) {
    if (e?.code === 11000) throw conflict('An account with this email already exists', 'EMAIL_TAKEN');
    throw e;
  }
  res.ok({ token: signToken(user._id), user: publicUser(user) }, 201, 'Account created');
});

export const login = asyncHandler(async (req, res) => {
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const errors = {};
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Enter your password';
  assertValid(errors);

  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Invalid email or password');
  res.ok({ token: signToken(user._id), user: publicUser(user) }, 200, 'Signed in');
});

export const me = asyncHandler(async (req, res) => {
  res.ok({ user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const name = str(req.body.name);
  const phone = normalizePhone(req.body.phone);
  const errors = {};
  if (name.length < 2 || name.length > 80) errors.name = 'Enter your full name (2-80 characters)';
  if (!PHONE_RE.test(phone)) errors.phone = 'Enter a valid phone number (10-13 digits)';
  assertValid(errors);
  const user = await User.findByIdAndUpdate(req.user.id, { $set: { name, phone } }, { new: true });
  res.ok({ user: publicUser(user) }, 200, 'Profile updated');
});
