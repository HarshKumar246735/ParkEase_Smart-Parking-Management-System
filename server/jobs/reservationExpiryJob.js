import { expireDueReservations } from '../services/reservationExpiryService.js';
import { env } from '../config/env.js';

/** Expires overdue reservations on an interval. Idempotent; reconcile() also covers missed ticks. */
export function startReservationExpiryJob() {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const n = await expireDueReservations(new Date());
      if (n) console.log(`[job:reservation-expiry] expired ${n} reservation(s)`);
    } catch (e) {
      console.error('[job:reservation-expiry]', e.message);
    } finally {
      busy = false;
    }
  };
  const handle = setInterval(tick, env.jobIntervalMs);
  tick();
  return () => clearInterval(handle);
}
