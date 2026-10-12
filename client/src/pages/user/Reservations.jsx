import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import ReservationCard from '../../components/reservations/ReservationCard.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { SkeletonCards } from '../../components/common/Loader.jsx';
import { reservationService } from '../../services/reservationService.js';
import { getErrorMessage } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import '../../css/Reservations.css';

const FILTERS = [['', 'All'], ['ACTIVE', 'Active'], ['CHECKED_IN', 'Checked in'], ['EXPIRED', 'Expired'], ['CANCELLED', 'Cancelled']];

export default function Reservations() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const { data, loading, error, reload } = usePolling(() => reservationService.mine(status ? { status } : {}).then((d) => d.reservations), [status], 10000);

  const arrive = async (r) => {
    setBusyId(r.id);
    try {
      await reservationService.checkIn(r.id);
      toast.success('Welcome! Your parking session has started.');
      navigate('/app/active');
    } catch (e) {
      toast.error(getErrorMessage(e));
      reload();
    } finally { setBusyId(null); }
  };

  const cancel = async () => {
    setBusyId(toCancel.id);
    try {
      await reservationService.cancel(toCancel.id);
      toast.success('Reservation cancelled. The slot is available again.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    setBusyId(null); setToCancel(null); reload();
  };

  return (
    <>
      <PageHeader title="My reservations" subtitle="Active, expired, cancelled and checked-in bookings." />
      <div className="chip-row" role="group" aria-label="Filter by status">
        {FILTERS.map(([v, l]) => <button key={v} className={`pill ${status === v ? 'active' : ''}`} onClick={() => setStatus(v)}>{l}</button>)}
      </div>
      {loading && !data ? <SkeletonCards count={3} height={130} /> : error && !data ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? (
        <div className="card"><EmptyState icon={CalendarClock} title="No reservations here" message="Reserve a bay from Find parking and it will show up here with its arrival countdown." /></div>
      ) : (
        <div className="res-list">
          {data.map((r) => <ReservationCard key={r.id} reservation={r} busyId={busyId} onArrive={arrive} onCancel={setToCancel} onElapsed={reload} />)}
        </div>
      )}
      {toCancel && <ConfirmDialog title="Cancel this reservation?" message={`Slot ${toCancel.slot?.slotNumber} will be released right away so others can book it.`} confirmLabel="Cancel reservation" danger busy={busyId === toCancel.id} onConfirm={cancel} onCancel={() => setToCancel(null)} />}
    </>
  );
}
