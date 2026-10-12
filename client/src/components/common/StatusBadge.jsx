const MAPS = {
  slot: {
    AVAILABLE: ['green', 'Available'], RESERVED: ['blue', 'Reserved'], OCCUPIED: ['red', 'Occupied'],
    RELEASE_PENDING: ['orange', 'Release pending'], MAINTENANCE: ['gray', 'Maintenance'],
  },
  reservation: { ACTIVE: ['blue', 'Active'], CHECKED_IN: ['green', 'Checked in'], EXPIRED: ['gray', 'Expired'], CANCELLED: ['red', 'Cancelled'] },
  session: { ACTIVE: ['green', 'Parked'], PAYMENT_PENDING: ['orange', 'Payment pending'], PAID: ['blue', 'Paid - releasing slot'], COMPLETED: ['teal', 'Completed'] },
  payment: { SUCCESS: ['green', 'Success'], PENDING: ['orange', 'Pending'], FAILED: ['red', 'Failed'] },
  vehicle: { IDLE: ['gray', 'Not parked'], BUSY: ['blue', 'In use'], RESERVED: ['blue', 'Reserved'], PARKED: ['teal', 'Parked'] },
  role: { ADMIN: ['teal', 'Admin'], VISITOR: ['gray', 'Visitor'] },
};

export default function StatusBadge({ status, kind = 'slot' }) {
  const [tone, label] = MAPS[kind]?.[status] || ['gray', status || '-'];
  return <span className={`badge badge-${tone}`}>{label}</span>;
}
