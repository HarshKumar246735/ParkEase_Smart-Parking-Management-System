import test from 'node:test';
import assert from 'node:assert/strict';
import { billableMinutes, computeCharges } from '../utils/billing.js';
import { canTransition, assertTransition } from '../utils/slotStateMachine.js';
import { normalizeRegistration, passwordProblem, escapeRegex } from '../utils/validate.js';

const T0 = new Date('2026-01-01T14:00:00.000Z').getTime();
const at = (sec) => T0 + sec * 1000;

test('minimum billable duration is one minute', () => {
  assert.equal(billableMinutes(T0, T0), 1);
  assert.equal(billableMinutes(T0, at(1)), 1);
  assert.equal(billableMinutes(T0, at(-30)), 1);
});

test('elapsed time is rounded up to the next minute', () => {
  assert.equal(billableMinutes(T0, at(60)), 1);
  assert.equal(billableMinutes(T0, at(61)), 2);
  assert.equal(billableMinutes(T0, at(44 * 60 + 1)), 45);
});

test('spec examples at Rs 2/minute', () => {
  const table = { 1: 2, 5: 10, 15: 30, 30: 60, 45: 90, 60: 120 };
  for (const [min, fee] of Object.entries(table)) {
    const c = computeCharges({ arrivalAt: T0, endAt: at(Number(min) * 60), ratePerMinute: 2 });
    assert.equal(c.billableMinutes, Number(min));
    assert.equal(c.parkingCharge, fee);
    assert.equal(c.finalAmount, fee);
  }
});

test('convenience fee and discount are applied; discount cannot exceed total', () => {
  const c = computeCharges({ arrivalAt: T0, endAt: at(45 * 60), ratePerMinute: 2, convenienceFee: 5 });
  assert.equal(c.finalAmount, 95);
  const d = computeCharges({ arrivalAt: T0, endAt: at(60), ratePerMinute: 2, discount: 999 });
  assert.equal(d.finalAmount, 0);
});

test('fractional rates are rounded to 2 decimals', () => {
  const c = computeCharges({ arrivalAt: T0, endAt: at(3 * 60), ratePerMinute: 0.335 });
  assert.equal(c.parkingCharge, 1.01);
});

test('slot state machine allows only the documented transitions', () => {
  const ok = [['AVAILABLE', 'RESERVED'], ['RESERVED', 'OCCUPIED'], ['RESERVED', 'AVAILABLE'], ['OCCUPIED', 'RELEASE_PENDING'],
    ['RELEASE_PENDING', 'AVAILABLE'], ['AVAILABLE', 'MAINTENANCE'], ['MAINTENANCE', 'AVAILABLE']];
  for (const [a, b] of ok) assert.ok(canTransition(a, b), `${a}->${b}`);
  const bad = [['OCCUPIED', 'AVAILABLE'], ['AVAILABLE', 'OCCUPIED'], ['RELEASE_PENDING', 'RESERVED'], ['RESERVED', 'MAINTENANCE'], ['OCCUPIED', 'MAINTENANCE']];
  for (const [a, b] of bad) {
    assert.ok(!canTransition(a, b), `${a}->${b}`);
    assert.throws(() => assertTransition(a, b));
  }
});

test('validators', () => {
  assert.equal(normalizeRegistration(' dl 8c-ab 1234 '), 'DL8CAB1234');
  assert.ok(passwordProblem('short1'));
  assert.ok(passwordProblem('allletters'));
  assert.equal(passwordProblem('Parking123'), null);
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
});
