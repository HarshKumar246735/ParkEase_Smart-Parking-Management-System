import crypto from 'node:crypto';

/** e.g. RSV-LK3F9A-7QX2A1 : prefix + base36 timestamp + random suffix (unique indexes are the real guard) */
export function generateReference(prefix) {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}
