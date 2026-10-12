import { Link } from 'react-router-dom';
import { MapPin, LogOut } from 'lucide-react';
import ParkingTimer from './ParkingTimer.jsx';
import PlateChip from '../common/PlateChip.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatDateTime, formatINR, placeLabel } from '../../utils/format.js';

export default function ActiveParkingCard({ session: s, onLeave, leaving = false, compact = false }) {
  return (
    <section className="apc" aria-label="Active parking session">
      <div className="apc-head">
        <div>
          <p className="apc-kicker">You are parked at</p>
          <h2 className="apc-slot">{s.slot?.slotNumber}</h2>
          <p className="apc-place"><MapPin size={14} /> {placeLabel(s.slot)}</p>
        </div>
        <div className="apc-head-right">
          <StatusBadge kind="session" status={s.status} />
          <PlateChip number={s.vehicle.registrationNumber} large />
        </div>
      </div>
      <ParkingTimer arrivalAt={s.arrivalAt} ratePerMinute={s.ratePerMinute} compact={compact} />
      <dl className="apc-facts">
        <div><dt>Arrived</dt><dd>{formatDateTime(s.arrivalAt)}</dd></div>
        <div><dt>Rate</dt><dd>{formatINR(s.ratePerMinute)} / minute</dd></div>
        <div><dt>Session</dt><dd className="num">{s.sessionNumber}</dd></div>
      </dl>
      {compact ? (
        <Link to="/app/active" className="btn btn-teal">Open live session</Link>
      ) : (
        <>
          <button className="btn btn-teal btn-lg apc-leave" onClick={onLeave} disabled={leaving}><LogOut size={18} /> {leaving ? 'Preparing your bill...' : "I'm leaving"}</button>
          <p className="apc-note">Time is rounded up to the next full minute. Your final bill is calculated by ParkEase when you tap <b>I&apos;m leaving</b> and then stays fixed while you pay.</p>
        </>
      )}
    </section>
  );
}
