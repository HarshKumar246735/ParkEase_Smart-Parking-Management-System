import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, LayoutDashboard, History } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState.jsx';
import { Skeleton } from '../../components/common/Loader.jsx';
import ReceiptCard from '../../components/payments/ReceiptCard.jsx';
import ReleaseCountdown from '../../components/sessions/ReleaseCountdown.jsx';
import { paymentService } from '../../services/paymentService.js';
import { getErrorMessage } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatINR } from '../../utils/format.js';
import '../../css/PaymentSuccess.css';

export default function PaymentSuccess() {
  const { paymentId } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState(5000);
  const { data, loading, error, reload } = usePolling(() => paymentService.get(paymentId), [paymentId], poll);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { if (data?.session?.status === 'COMPLETED') setPoll(0); }, [data]);

  if (loading && !data) return <Skeleton height={560} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const { payment: p, session: s } = data;

  // Never present a success screen unless the backend confirmed it.
  if (p.status !== 'SUCCESS') {
    return (
      <div className="card"><div className="empty">
        <h3>This payment is not complete</h3>
        <p>We have no confirmed payment for this invoice yet.</p>
        <Link className="btn btn-primary" to={`/app/pay/${s.id}`}>Go to checkout</Link>
      </div></div>
    );
  }

  const releaseMin = s.releaseAt && s.paymentSuccessTimestamp ? Math.round((new Date(s.releaseAt) - new Date(s.paymentSuccessTimestamp)) / 60000) : 2;
  const completed = s.status === 'COMPLETED';

  const download = async () => {
    setDownloading(true);
    try { await paymentService.downloadReceipt(p.id, p.receiptNumber); toast.success('Receipt downloaded'); }
    catch (e) { toast.error(getErrorMessage(e, 'Could not download the receipt')); }
    setDownloading(false);
  };

  return (
    <div className="success">
      <div className="success-hero card">
        <svg className="check" viewBox="0 0 52 52" aria-hidden="true"><circle className="check-circle" cx="26" cy="26" r="24" fill="none" /><path className="check-mark" fill="none" d="M14 27l8 8 16-17" /></svg>
        <h1>Payment Successful</h1>
        <span className="badge badge-demo">DEMO TRANSACTION</span>
        <p className="success-amount num">{formatINR(p.amount)}</p>
        <p className="success-msg">
          {completed
            ? 'Your payment is successful and your parking slot has been released. Thanks for parking with ParkEase!'
            : `Your payment is successful. Your parking slot will become available to other users in ${releaseMin} minute${releaseMin === 1 ? '' : 's'}.`}
        </p>
        <ReleaseCountdown releaseAt={s.releaseAt} completed={completed} onElapsed={reload} />
        <div className="success-actions">
          <button className="btn btn-primary" onClick={download} disabled={downloading}><Download size={16} /> {downloading ? 'Preparing...' : 'Download receipt'}</button>
          <Link className="btn btn-outline" to="/app/history"><History size={16} /> View my parking</Link>
          <Link className="btn btn-outline" to="/app"><LayoutDashboard size={16} /> Go to dashboard</Link>
        </div>
      </div>
      <div className="card"><ReceiptCard payment={p} session={s} userName={user?.name} /></div>
    </div>
  );
}
