import { badRequest } from './ApiError.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^\+?[0-9]{10,13}$/;
export const REG_RE = /^[A-Z0-9]{4,12}$/;

export const str = (v) => (typeof v === 'string' ? v.trim() : '');
export const normalizeRegistration = (v) => String(v ?? '').toUpperCase().replace(/[\s-]/g, '');
export const normalizePhone = (v) => String(v ?? '').replace(/[\s-]/g, '');
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function passwordProblem(p) {
  if (typeof p !== 'string' || p.length < 8) return 'Password must be at least 8 characters';
  if (p.length > 72) return 'Password must be 72 characters or fewer';
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return 'Password must contain at least one letter and one number';
  return null;
}

export function assertValid(errors) {
  if (Object.keys(errors).length) throw badRequest('Please correct the highlighted fields', errors);
}

export function parsePage(query, defaultLimit = 20) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function money(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
