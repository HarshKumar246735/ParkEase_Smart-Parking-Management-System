import { sessionService } from '../services/sessionService.js';
import { usePolling } from './usePolling.js';

/** The current user's open session (ACTIVE / PAYMENT_PENDING / PAID) - rebuilt from the backend after every refresh. */
export function useParkingSession(intervalMs = 20000) {
  return usePolling(() => sessionService.active().then((d) => d.session), [], intervalMs);
}
