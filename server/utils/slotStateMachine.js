/** Allowed slot status transitions. Enforced by backend services only. */
export const SLOT_TRANSITIONS = {
  AVAILABLE: ['RESERVED', 'MAINTENANCE'],
  RESERVED: ['OCCUPIED', 'AVAILABLE'],
  OCCUPIED: ['RELEASE_PENDING'],
  RELEASE_PENDING: ['AVAILABLE'],
  MAINTENANCE: ['AVAILABLE'],
};

export function canTransition(from, to) {
  return Boolean(SLOT_TRANSITIONS[from]?.includes(to));
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) throw new Error(`Illegal slot transition ${from} -> ${to}`);
}
