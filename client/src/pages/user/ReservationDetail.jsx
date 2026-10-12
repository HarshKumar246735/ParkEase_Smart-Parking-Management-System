import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, MapPin, Info } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import PlateChip from '../../components/common/PlateChip.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { Skeleton } from '../../components/common/Loader.jsx';
import ReservationCountdown from '../../components/reservations/ReservationCountdown.jsx';
import { reservationService } from '../../services/reservationService.js';
import { getErrorMessage } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import { formatDateTime, formatINR, placeLabel } from '../../utils/format.js';
import '../../css/Reservations.css';

const OUTCOME = {
  EXPIRED: { tone: 'warn', text: 'The arrival window ended before you checked in, so this reservation expired and the slot was released.' },
  CANCELLED: { tone: 'info', text: 'You cancelled this reservation. The slot was released.' },
  CHECKED_IN: { tone: 'ok', text: 'You have checked in. Your parking session is running.' },
};

export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: r, loading, error, reload } = usePolling(() => reservationService.get(id).then((d) => d.reservation), [id], 10000);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const arrive = async () => {
    setBusy(true);
    try {
      await reservationService.checkIn(id);
      toast.success('Welcome! Your parking session has started.');
      navigate('/app/active');
    } catch (e) { toast.error(getErrorMessage(e)); reload(); setBusy(false); }
  };
  const cancel = async () => {
    setBusy(true);
    try { await reservationService.cancel(id); toast.success('Reservation cancelled'); }
    catch (e) { toast.error(getErrorMessage(e)); }
    setBusy(false); setConfirmCancel(false); reload();
  };

  if (loading && !r) return <Skeleton height={420} />;
  if (error && !r) return <ErrorState message={error} onRetry={reload} />;
  const outcome = OUTCOME[r.status];

  return (
    <>
      <PageHeader title="Reservation confirmed" subtitle={`Reference ${r.reservationNumber}`} actions={<Link className="btn btn-outline" to="/app/reservations">All reservations</Link>} />
      <div className="res-detail">
        <div className="card res-hero">
          <div className="res-hero-top">
            <div>
              <p className="muted">Your bay</p>
              <h2 className="res-bigslot">{r.slot.slotNumber}</h2>
              <p className="res-place"><MapPin size={14} /> {placeLabel(r.slot)}</p>
            </div>
            <StatusBadge kind="reservation" status={r.status} />
          </div>
          {r.status === 'ACTIVE' ? (
            <>
              <ReservationCountdown createdAt={r.createdAt} expiresAt={r.expiresAt} onElapsed={reload} />
              <div className="res-cta">
                <button className="btn btn-teal btn-lg" onClick={arrive} disabled={busy}><CheckCircle2 size={18} /> {busy ? 'Checking in...' : 'I have arrived'}</button>
                <button className="btn btn-danger-outline" onClick={() => setConfirmCancel(true)} disabled={busy}>Cancel reservation</button>
              </div>
              <div className="alert alert-info"><Info size={18} /><span>Tap <b>I have arrived</b> once you reach the bay. Parking charges start at that moment.</span></div>
            </>
          ) : (
            <div className={`alert alert-${outcome?.tone || 'info'}`}><Info size={18} /><span>{outcome?.text}</span></div>
          )}
          {r.status === 'CHECKED_IN' && <Link to="/app/active" className="btn btn-primary">View live parking</Link>}
          {(r.status === 'EXPIRED' || r.status === 'CANCELLED') && <Link to="/app/parking" className="btn btn-primary">Find another slot</Link>}
        </div>

        <div className="card">
          <div className="card-head"><h3>Booking details</h3></div>
          <dl className="detail-list">
            <div><dt>Reservation ID</dt><dd className="num">{r.reservationNumber}</dd></div>
            <div><dt>Vehicle</dt><dd><PlateChip number={r.vehicle.registrationNumber} /></dd></div>
            <div><dt>Parking slot</dt><dd>{r.slot.slotNumber}</dd></div>
            <div><dt>Floor and zone</dt><dd>{placeLabel(r.slot)}</dd></div>
            <div><dt>Booked at</dt><dd>{formatDateTime(r.createdAt)}</dd></div>
            <div><dt>Arrival deadline</dt><dd>{formatDateTime(r.expiresAt)}</dd></div>
            {r.checkedInAt && <div><dt>Checked in at</dt><dd>{formatDateTime(r.checkedInAt)}</dd></div>}
            <div><dt>Rate</dt><dd>{r.ratePerMinute != null ? `${formatINR(r.ratePerMinute)} / minute` : '-'}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge kind="reservation" status={r.status} /></dd></div>
          </dl>
        </div>
      </div>
      {confirmCancel && <ConfirmDialog title="Cancel this reservation?" message="The slot will be released immediately." confirmLabel="Cancel reservation" danger busy={busy} onConfirm={cancel} onCancel={() => setConfirmCancel(false)} />}
    </>
  );
}
