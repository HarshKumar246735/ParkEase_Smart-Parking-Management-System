import { Link } from 'react-router-dom';
import { MapPin, CalendarClock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import PlateChip from '../common/PlateChip.jsx';
import ReservationCountdown from './ReservationCountdown.jsx';
import { formatDateTime, placeLabel } from '../../utils/format.js';

export default function ReservationCard({ reservation: r, onCancel, onArrive, onElapsed, busyId }) {
  const busy = busyId === r.id;
  return (
    <article className={`res-card res-${r.status}`}>
      <div className="res-main">
        <div className="res-top">
          <strong className="res-slot">{r.slot?.slotNumber}</strong>
          <StatusBadge kind="reservation" status={r.status} />
        </div>
        <p className="res-place"><MapPin size={14} /> {placeLabel(r.slot)}</p>
        <PlateChip number={r.vehicle.registrationNumber} />
        <p className="res-meta"><CalendarClock size={14} /> Booked {formatDateTime(r.createdAt)} - Ref <span className="num">{r.reservationNumber}</span></p>
      </div>
      {r.status === 'ACTIVE' && (
        <div className="res-side">
          <ReservationCountdown createdAt={r.createdAt} expiresAt={r.expiresAt} onElapsed={onElapsed} size="sm" />
          <div className="res-actions">
            <button className="btn btn-teal btn-sm" onClick={() => onArrive(r)} disabled={busy}>I have arrived</button>
            <button className="btn btn-danger-outline btn-sm" onClick={() => onCancel(r)} disabled={busy}>Cancel</button>
          </div>
        </div>
      )}
      <div className="res-link"><Link to={`/app/reservations/${r.id}`}>Details</Link></div>
    </article>
  );
}
