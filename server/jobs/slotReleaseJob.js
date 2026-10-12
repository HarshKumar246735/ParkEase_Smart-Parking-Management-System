import { releaseDueSessions } from '../services/slotReleaseService.js';
import { reconcile } from '../services/parkingAvailabilityService.js';
import { env } from '../config/env.js';

/** Releases RELEASE_PENDING slots once releaseAt has passed, then runs the full reconciliation/healing pass. */
export function startSlotReleaseJob() {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const n = await releaseDueSessions(new Date());
      if (n) console.log(`[job:slot-release] released ${n} slot(s)`);
      await reconcile();
    } catch (e) {
      console.error('[job:slot-release]', e.message);
    } finally {
      busy = false;
    }
  };
  const handle = setInterval(tick, env.jobIntervalMs);
  tick();
  return () => clearInterval(handle);
}
