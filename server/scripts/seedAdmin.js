/* Creates the initial administrator from environment variables. Safe to re-run (never duplicates, never overwrites). */
import bcrypt from 'bcryptjs';
import { assertEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

async function run() {
  assertEnv();
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your environment before seeding the admin.');
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  await connectDB();
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[seed:admin] ${email} already exists (role ${existing.role}). Nothing changed.`);
  } else {
    await User.create({ name: ADMIN_NAME || 'ParkEase Admin', email, phone: '9000000000', passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: 'ADMIN' });
    console.log(`[seed:admin] administrator created: ${email}`);
  }
}
run().catch((e) => { console.error('[seed:admin] failed:', e.message); process.exitCode = 1; }).finally(() => disconnectDB());
