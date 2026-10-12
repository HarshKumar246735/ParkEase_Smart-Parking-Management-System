import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { success: false, message, code: 'RATE_LIMITED' } });

export const apiLimiter = make(60 * 1000, 600, 'Too many requests. Please slow down.');
export const authLimiter = make(15 * 60 * 1000, 30, 'Too many sign-in attempts. Try again in a few minutes.');
export const sensitiveLimiter = make(60 * 1000, 40, 'Too many requests for this action. Please wait a moment.');
