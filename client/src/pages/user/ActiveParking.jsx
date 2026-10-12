import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Timer } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import ActiveParkingCard from '../../components/sessions/ActiveParkingCard.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { Skeleton } from '../../components/common/Loader.jsx';
import { useParkingSession } from '../../hooks/useParkingSession.js';
import { sessionService } from '../../services/sessionService.js';
import { getErrorMessage } from '../../services/api.js';
import '../../css/ActiveParking.css';

export default function ActiveParking() {
  const navigate = useNavigate();
  const { data: session, loading, error, reload } = useParkingSession(15000);
  const [confirm, setConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (loading && session === null) return <Skeleton height={420} />;
  if (error && session === null) return <ErrorState message={error} onRetry={reload} />;
  if (!session) {
    return (
      <>
        <PageHeader title="Active parking" />
        <div className="card"><EmptyState icon={Timer} title="You are not parked right now" message="When you tap I have arrived on a reservation, your live timer and charges appear here." action={<Link className="btn btn-primary" to="/app/parking">Find parking</Link>} /></div>
      </>
    );
  }
  if (session.status === 'PAYMENT_PENDING') return <Navigate to={`/app/bill/${session.id}`} replace />;
  if (session.status === 'PAID') return <Navigate to={`/app/success/${session.paymentId}`} replace />;

  const leave = async () => {
    setLeaving(true);
    try {
      const { session: s } = await sessionService.leave(session.id);
      toast.success('Your bill is ready');
      navigate(`/app/bill/${s.id}`);
    } catch (e) { toast.error(getErrorMessage(e)); setLeaving(false); setConfirm(false); reload(); }
  };

  return (
    <>
      <PageHeader title="Active parking" subtitle="Your timer and charge are rebuilt from the server, so they stay correct if you refresh or switch device." />
      <div className="apc-wrap"><ActiveParkingCard session={session} leaving={leaving} onLeave={() => setConfirm(true)} /></div>
      {confirm && <ConfirmDialog title="Finish parking?" message="We will stop the timer and prepare your final bill. You can then pay with a demo payment method." confirmLabel="Get my bill" cancelLabel="Keep parking" busy={leaving} onConfirm={leave} onCancel={() => setConfirm(false)} />}
    </>
  );
}
