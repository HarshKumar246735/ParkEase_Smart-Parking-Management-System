import { forbidden } from '../utils/ApiError.js';

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(forbidden('Administrator access required'));
  next();
};
export const adminOnly = requireRole('ADMIN');
