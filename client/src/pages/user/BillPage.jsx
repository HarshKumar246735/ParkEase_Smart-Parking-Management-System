import { Link, Navigate, useParams } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import ParkingBillSummary from '../../components/sessions/ParkingBillSummary.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { Skeleton } from '../../components/common/Loader.jsx';
import { sessionService } from '../../services/sessionService.js';
import { usePolling } from '../../hooks/usePolling.js';
import '../../css/Bill.css';

export default function BillPage() {
  const { sessionId } = useParams();
  const { data: s, loading, error, reload } = usePolling(() => sessionService.bill(sessionId).then((d) => d.session), [sessionId], 0);
  if (loading && !s) return <Skeleton height={460} />;
  if (error && !s) return <ErrorState message={error} onRetry={reload} />;
  if (s.status === 'ACTIVE') return <Navigate to="/app/active" replace />;
  const paid = s.status === 'PAID' || s.status === 'COMPLETED';
  return (
    <>
      <PageHeader title="Your parking bill" subtitle="Check the details, then continue to payment." />
      <div className="bill-wrap">
        <div className="card"><ParkingBillSummary session={s} /></div>
        <div className="card bill-cta">
          {paid ? (
            <>
              <p className="muted">This invoice has already been paid.</p>
              <Link className="btn btn-primary btn-lg" to={`/app/success/${s.paymentId}`}>View payment</Link>
            </>
          ) : (
            <>
              <p className="muted">Choose a demo payment method on the next screen. No real money will be charged.</p>
              <Link className="btn btn-teal btn-lg" to={`/app/pay/${s.id}`}><CreditCard size={18} /> Proceed to payment</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
