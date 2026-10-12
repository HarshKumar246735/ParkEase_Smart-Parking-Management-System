import { billableMinutes } from './billing.js';

const idOf = (d) => (d ? String(d._id ?? d) : null);
/** populated document (as opposed to a bare ObjectId) */
const isDoc = (d) => Boolean(d) && typeof d === 'object' && d._id !== undefined && d._bsontype === undefined;
const ref = (d) => (isDoc(d) ? { id: idOf(d), code: d.code, name: d.name } : null);

export function slotInfo(slot) {
  if (!isDoc(slot)) return slot ? { id: idOf(slot) } : null;
  return {
    id: idOf(slot),
    slotNumber: slot.slotNumber,
    slotType: slot.slotType,
    status: slot.status,
    floor: ref(slot.floorId),
    zone: ref(slot.zoneId),
  };
}

export function vehicleDTO(v, status) {
  if (!v) return null;
  return {
    id: idOf(v),
    registrationNumber: v.registrationNumber,
    vehicleType: v.vehicleType,
    brand: v.brand,
    model: v.model,
    color: v.color,
    nickname: v.nickname || '',
    status: status || undefined,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

export function reservationDTO(r, ratePerMinute) {
  const veh = isDoc(r.vehicleId) ? r.vehicleId : null;
  return {
    id: idOf(r),
    reservationNumber: r.reservationNumber,
    status: r.status,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    checkedInAt: r.checkedInAt || null,
    cancelledAt: r.cancelledAt || null,
    expiredAt: r.expiredAt || null,
    sessionId: r.sessionId ? idOf(r.sessionId) : null,
    vehicle: veh
      ? { id: idOf(veh), registrationNumber: veh.registrationNumber, vehicleType: veh.vehicleType, nickname: veh.nickname || '' }
      : { id: idOf(r.vehicleId) },
    slot: slotInfo(r.slotId),
    user: isDoc(r.userId) ? { id: idOf(r.userId), name: r.userId.name, email: r.userId.email } : undefined,
    ratePerMinute: ratePerMinute ?? undefined,
  };
}

export function sessionDTO(s, now = new Date()) {
  const dto = {
    id: idOf(s),
    sessionNumber: s.sessionNumber,
    status: s.status,
    vehicle: { id: idOf(s.vehicleId), registrationNumber: s.registrationNumber, vehicleType: s.vehicleType },
    slot: slotInfo(s.slotId),
    reservationId: idOf(s.reservationId),
    user: isDoc(s.userId) ? { id: idOf(s.userId), name: s.userId.name, email: s.userId.email } : undefined,
    arrivalAt: s.arrivalAt,
    departureAt: s.departureAt || null,
    ratePerMinute: s.ratePerMinute,
    convenienceFee: s.convenienceFee,
    billableMinutes: s.billableMinutes ?? null,
    parkingCharge: s.parkingCharge ?? null,
    discount: s.discount ?? 0,
    finalAmount: s.finalAmount ?? null,
    invoiceNumber: s.invoiceNumber || null,
    paymentId: s.paymentId ? idOf(s.paymentId) : null,
    paymentSuccessTimestamp: s.paymentSuccessTimestamp || null,
    releaseAt: s.releaseAt || null,
    completedAt: s.completedAt || null,
    live: null,
  };
  if (s.status === 'ACTIVE') {
    const elapsedMs = Math.max(0, now.getTime() - new Date(s.arrivalAt).getTime());
    const minutes = billableMinutes(new Date(s.arrivalAt).getTime(), now.getTime());
    dto.live = {
      elapsedSeconds: Math.floor(elapsedMs / 1000),
      billableMinutes: minutes,
      estimatedCharge: Math.round(minutes * s.ratePerMinute * 100) / 100,
    };
  }
  return dto;
}

export function paymentDTO(p) {
  return {
    id: idOf(p),
    transactionReference: p.transactionReference,
    receiptNumber: p.receiptNumber,
    invoiceNumber: p.invoiceNumber,
    amount: p.amount,
    currency: p.currency,
    method: p.method,
    provider: p.provider,
    status: p.status,
    demoMode: p.demoMode,
    paidAt: p.paidAt || null,
    createdAt: p.createdAt,
    sessionId: idOf(p.sessionId),
    user: isDoc(p.userId) ? { id: idOf(p.userId), name: p.userId.name, email: p.userId.email } : undefined,
    session: isDoc(p.sessionId)
      ? {
          id: idOf(p.sessionId),
          sessionNumber: p.sessionId.sessionNumber,
          registrationNumber: p.sessionId.registrationNumber,
          slotNumber: isDoc(p.sessionId.slotId) ? p.sessionId.slotId.slotNumber : undefined,
        }
      : undefined,
  };
}
