export const formatINR = (n) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(Number(n ?? 0)) ? 0 : 2, maximumFractionDigits: 2 })}`;

export const formatDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
export const formatTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-');
export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '-');

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const formatMinutes = (min) => {
  if (min == null) return '-';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
};

export const VEHICLE_LABELS = { BIKE: 'Bike', CAR: 'Car', SUV: 'SUV', ELECTRIC: 'Electric Vehicle' };
export const SLOT_TYPE_LABELS = { STANDARD: 'Standard', PREMIUM: 'Premium', EV_CHARGING: 'EV Charging', ACCESSIBLE: 'Accessible' };
export const METHOD_LABELS = { UPI: 'UPI', CARD: 'Card', NETBANKING: 'Net Banking', WALLET: 'Wallet' };
export const slotLabel = (slot) => (slot ? `${slot.slotNumber}` : '-');
export const placeLabel = (slot) => (slot?.floor ? `${slot.floor.name}, ${slot.zone?.name}` : '');
