/*
 * End-to-end smoke test against a RUNNING API (needs a seeded database):
 *   API_URL=http://localhost:5000/api node scripts/e2eSmoke.js
 * It registers two throw-away users and walks the whole journey, including the 2-minute release.
 * Takes ~2 minutes because it waits for the real release delay (default 2 min).
 */
const API = process.env.API_URL || 'http://localhost:5000/api';
const stamp = Date.now();
let passed = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`  FAIL  ${msg}`); process.exitCode = 1; throw new Error(msg); } passed += 1; console.log(`  ok    ${msg}`); };

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reg = (n) => call('POST', '/auth/register', { body: { name: `Smoke ${n}`, email: `smoke${n}.${stamp}@example.com`, phone: '9876500000', password: 'Smoke1234', confirmPassword: 'Smoke1234' } });

async function main() {
  console.log(`Smoke test against ${API}`);
  const a = await reg('a'); ok(a.status === 201, 'register user A');
  ok((await reg('a')).status === 409, 'duplicate registration rejected');
  const b = await reg('b');
  ok((await call('POST', '/auth/login', { body: { email: `smoke-a.${stamp}@example.com`, password: 'x' } })).status === 401, 'invalid login rejected');
  ok((await call('GET', '/admin/users', { token: a.data.token })).status === 403, 'visitor cannot reach admin API');
  ok((await call('GET', '/vehicles')).status === 401, 'protected route requires auth');
  const ta = a.data.token; const tb = b.data.token;

  const va = (await call('POST', '/vehicles', { token: ta, body: { registrationNumber: `SA${stamp % 100000}`, vehicleType: 'CAR', brand: 'Test', model: 'A', color: 'Red' } })).data.vehicle;
  const vb = (await call('POST', '/vehicles', { token: tb, body: { registrationNumber: `SB${stamp % 100000}`, vehicleType: 'CAR', brand: 'Test', model: 'B', color: 'Blue' } })).data.vehicle;
  ok(va?.id && vb?.id, 'vehicles created');

  const slots = (await call('GET', '/parking/slots?status=AVAILABLE&vehicleType=CAR', { token: ta })).data.slots.filter((s) => s.compatible);
  ok(slots.length >= 2, 'available slots returned from backend');
  const slot = slots[0];
  const [r1, r2] = await Promise.all([call('POST', '/reservations', { token: ta, body: { vehicleId: va.id, slotId: slot.id } }), call('POST', '/reservations', { token: tb, body: { vehicleId: vb.id, slotId: slot.id } })]);
  ok([r1.status, r2.status].sort().join() === '201,409', 'two users racing for one slot: exactly one wins');
  const winner = r1.status === 201 ? { t: ta, v: va, r: r1.data.reservation } : { t: tb, v: vb, r: r2.data.reservation };
  const loser = winner.t === ta ? tb : ta;
  const left = (new Date(winner.r.expiresAt) - new Date(winner.r.createdAt)) / 60000;
  ok(Math.abs(left - 15) < 0.01, 'arrival deadline = creation + 15 minutes');
  ok((await call('DELETE', `/reservations/${winner.r.id}`, { token: loser })).status === 404, "cannot cancel another user's reservation");

  const ci = await call('POST', `/reservations/${winner.r.id}/check-in`, { token: winner.t });
  ok(ci.status === 200 && ci.data.session.status === 'ACTIVE', 'check-in creates an ACTIVE session');
  const ci2 = await call('POST', `/reservations/${winner.r.id}/check-in`, { token: winner.t });
  ok(ci2.status === 200 && ci2.data.session.id === ci.data.session.id, 'repeated check-in returns the same single session');
  const sid = ci.data.session.id;
  ok((await call('POST', `/parking/sessions/${sid}/leave`, { token: loser })).status === 404, "cannot finalize another user's session");

  const l1 = await call('POST', `/parking/sessions/${sid}/leave`, { token: winner.t });
  const l2 = await call('POST', `/parking/sessions/${sid}/leave`, { token: winner.t });
  ok(l1.data.session.finalAmount === l2.data.session.finalAmount && l1.data.session.invoiceNumber === l2.data.session.invoiceNumber, 'finalized invoice is stable on repeated "I\'m leaving"');
  ok(l1.data.session.finalAmount === l1.data.session.billableMinutes * 2, 'amount = billable minutes x Rs 2');

  ok((await call('POST', '/payments/demo', { token: winner.t, body: { sessionId: sid, method: 'CARD', provider: 'Credit Card', amount: 1, cardNumber: '4111111111111111' } })).status === 400, 'payload with credentials/amount is rejected');
  ok((await call('POST', '/payments/demo', { token: loser, body: { sessionId: sid, method: 'UPI', provider: 'Google Pay' } })).status === 404, "cannot pay another user's invoice");
  const [p1, p2] = await Promise.all([1, 2].map(() => call('POST', '/payments/demo', { token: winner.t, body: { sessionId: sid, method: 'UPI', provider: 'Google Pay' } })));
  ok(p1.status < 300 && p2.status < 300 && p1.data.payment.id === p2.data.payment.id, 'double submit yields ONE payment');
  ok(p1.data.payment.amount === l1.data.session.finalAmount, 'charged amount equals server-finalized amount');
  const paid = p1.data.session;
  ok(paid.status === 'PAID' && paid.releaseAt, 'session PAID with releaseAt');
  ok(Math.abs((new Date(paid.releaseAt) - new Date(paid.paymentSuccessTimestamp)) / 60000 - 2) < 0.01 || process.env.RELEASE_MINUTES, 'releaseAt = payment + 2 minutes');
  const rc = await fetch(`${API}/payments/${p1.data.payment.id}/receipt`, { headers: { Authorization: `Bearer ${winner.t}` } });
  ok(rc.status === 200 && (await rc.text()).includes('DEMO PAYMENT'), 'receipt downloads with DEMO PAYMENT marker');

  const state = async () => (await call('GET', `/parking/slots/${slot.id}`, { token: loser })).data.slot.status;
  ok((await state()) === 'RELEASE_PENDING', 'slot is RELEASE_PENDING right after payment');
  ok((await call('POST', '/reservations', { token: loser, body: { vehicleId: winner.t === ta ? vb.id : va.id, slotId: slot.id } })).status === 409, 'slot cannot be booked during release delay');

  const wait = Math.max(0, new Date(paid.releaseAt) - Date.now()) + 3000;
  console.log(`  ...waiting ${Math.round(wait / 1000)}s for server-side release (no client involved)`);
  await sleep(wait);
  ok((await state()) === 'AVAILABLE', 'slot AVAILABLE after releaseAt');
  const again = await call('POST', '/reservations', { token: loser, body: { vehicleId: winner.t === ta ? vb.id : va.id, slotId: slot.id } });
  ok(again.status === 201, 'another user can now book the released slot');
  await call('DELETE', `/reservations/${again.data.reservation.id}`, { token: loser });
  console.log(`\nAll ${passed} checks passed.`);
}
main().catch((e) => { console.error('\nSmoke test aborted:', e.message); process.exitCode = 1; });
