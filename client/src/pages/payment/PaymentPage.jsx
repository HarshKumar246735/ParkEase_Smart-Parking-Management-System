import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Info } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { Skeleton } from '../../components/common/Loader.jsx';
import PaymentMethodSelector from '../../components/payments/PaymentMethodSelector.jsx';
import PaymentOrderSummary from '../../components/payments/PaymentOrderSummary.jsx';
import PaymentProcessing from '../../components/payments/PaymentProcessing.jsx';
import { sessionService } from '../../services/sessionService.js';
import { paymentService } from '../../services/paymentService.js';
import { parkingService } from '../../services/parkingService.js';
import { getErrorMessage } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import { EMPTY_FORM, validatePaymentForm } from '../../utils/paymentValidation.js';
import { formatINR } from '../../utils/format.js';
import '../../css/PaymentPage.css';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function PaymentPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const bill = usePolling(() => sessionService.bill(sessionId).then((d) => d.session), [sessionId], 0);
  const options = usePolling(() => paymentService.options().then((d) => d.options), [], 0);
  const rules = usePolling(() => parkingService.rates(), [], 0);

  const [method, setMethod] = useState('UPI');
  const [provider, setProvider] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const submitting = useRef(false); // blocks double-clicks before React re-renders

  const s = bill.data;
  if ((bill.loading && !s) || (options.loading && !options.data)) return <Skeleton height={520} />;
  if (bill.error && !s) return <ErrorState message={bill.error} onRetry={bill.reload} />;
  if (options.error && !options.data) return <ErrorState message={options.error} onRetry={options.reload} />;
  if (s.status === 'ACTIVE') return <Navigate to="/app/active" replace />;
  if (s.status !== 'PAYMENT_PENDING') return <Navigate to={`/app/success/${s.paymentId}`} replace />;

  const changeMethod = (m) => { setMethod(m); setProvider(m === 'CARD' ? 'Debit Card' : ''); setErrors({}); };

  const pay = async () => {
    if (submitting.current) return;
    const found = validatePaymentForm(method, provider, form);
    setErrors(found);
    if (Object.keys(found).length) { toast.error('Please complete the highlighted payment details'); return; }
    submitting.current = true;
    setProcessing(true);
    try {
      // Only the method label goes to the server. The amount is read from the finalized invoice in the database.
      const [result] = await Promise.all([paymentService.pay({ sessionId: s.id, method, provider }), sleep(1500)]);
      setForm(EMPTY_FORM); // discard any demo credentials from memory
      toast.success('Payment successful');
      navigate(`/app/success/${result.payment.id}`, { replace: true });
    } catch (e) {
      toast.error(getErrorMessage(e));
      submitting.current = false;
      setProcessing(false);
      bill.reload();
    }
  };

  return (
    <>
      <PageHeader title="Checkout" subtitle="Pay your parking bill with a demo payment method." actions={<Link className="btn btn-outline" to={`/app/bill/${s.id}`}>Back to bill</Link>} />
      <div className="demo-banner" role="note"><Info size={18} /><strong>DEMO PAYMENT</strong><span>No real money will be charged. Do not enter real card or bank details.</span></div>
      <div className="pay-layout">
        <section className="card pay-main" aria-label="Payment details">
          <div className="card-head"><h2>Payment method</h2></div>
          <PaymentMethodSelector
            options={options.data} method={method} provider={provider} form={form} errors={errors} disabled={processing}
            onMethod={changeMethod} onProvider={(p) => { setProvider(p); setErrors({}); }} onForm={setForm}
          />
          <button className="btn btn-teal btn-lg btn-block pay-btn" onClick={pay} disabled={processing}>
            <Lock size={18} /> {processing ? 'Processing...' : `Pay ${formatINR(s.finalAmount)} now`}
          </button>
          <p className="muted pay-fine">Card numbers, CVVs and UPI IDs stay in this form and are never sent to or stored by ParkEase.</p>
        </section>
        <PaymentOrderSummary session={s} mallName={rules.data?.mallName || 'ParkEase Mall'} />
      </div>
      <PaymentProcessing show={processing} />
    </>
  );
}
