import { parkingService } from '../services/parkingService.js';
import { usePolling } from './usePolling.js';

export function useParkingAvailability(intervalMs = 15000) {
  return usePolling(() => parkingService.availability(), [], intervalMs);
}
