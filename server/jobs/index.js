import { startReservationExpiryJob } from './reservationExpiryJob.js';
import { startSlotReleaseJob } from './slotReleaseJob.js';

export function startJobs() {
  const stops = [startReservationExpiryJob(), startSlotReleaseJob()];
  console.log('[jobs] reservation-expiry and slot-release jobs started');
  return () => stops.forEach((s) => s());
}
