import { Car, Zap, Accessibility, Star, Wrench, Hourglass } from 'lucide-react';
import { SLOT_TYPE_LABELS, formatINR } from '../../utils/format.js';

const TYPE_ICON = { EV_CHARGING: Zap, ACCESSIBLE: Accessibility, PREMIUM: Star };
const STATUS_LABEL = { AVAILABLE: 'Available', RESERVED: 'Reserved', OCCUPIED: 'Occupied', RELEASE_PENDING: 'Releasing', MAINTENANCE: 'Maintenance' };

export default function ParkingSlotCard({ slot, onSelect, selected = false }) {
  const TypeIcon = TYPE_ICON[slot.slotType];
  const bookable = slot.status === 'AVAILABLE';
  const dim = bookable && !slot.compatible;
  const shortNo = slot.slotNumber.split('-').pop();
  const title = `${slot.slotNumber} - ${SLOT_TYPE_LABELS[slot.slotType]} - ${STATUS_LABEL[slot.status]}${slot.ratePerMinute != null ? ` - ${formatINR(slot.ratePerMinute)}/min` : ''}${dim ? ' - EV vehicles only' : ''}`;
  return (
    <button
      type="button"
      className={`slot slot-${slot.status} ${selected ? 'is-selected' : ''} ${dim ? 'is-dim' : ''}`}
      onClick={() => onSelect?.(slot)}
      disabled={!bookable}
      title={title}
      aria-label={title}
    >
      <span className="slot-type">{TypeIcon ? <TypeIcon size={13} /> : null}</span>
      <span className="slot-glyph" aria-hidden="true">
        {slot.status === 'AVAILABLE' && <b>P</b>}
        {(slot.status === 'OCCUPIED' || slot.status === 'RESERVED') && <Car size={26} />}
        {slot.status === 'RELEASE_PENDING' && <Hourglass size={22} />}
        {slot.status === 'MAINTENANCE' && <Wrench size={22} />}
      </span>
      <span className="slot-no">{shortNo}</span>
      <span className="slot-state">{STATUS_LABEL[slot.status]}</span>
    </button>
  );
}
