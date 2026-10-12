import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Info } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import FormField from '../../components/common/FormField.jsx';
import VehicleIcon from '../../components/common/VehicleIcon.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { SkeletonCards } from '../../components/common/Loader.jsx';
import { adminService } from '../../services/adminService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import { VEHICLE_LABELS } from '../../utils/format.js';
import '../../css/AdminManagement.css';

function RateCard({ rate, onSaved }) {
  const [f, setF] = useState({ ratePerMinute: rate.ratePerMinute, convenienceFee: rate.convenienceFee });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await adminService.updateRate(rate.vehicleType, { ratePerMinute: Number(f.ratePerMinute), convenienceFee: Number(f.convenienceFee) }); setErrors({}); toast.success(`${VEHICLE_LABELS[rate.vehicleType]} rate saved`); onSaved(); }
    catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); }
    setBusy(false);
  };
  return (
    <form className="card rate-card" onSubmit={save} noValidate>
      <div className="rate-title"><span className="veh-icon"><VehicleIcon type={rate.vehicleType} /></span><h3>{VEHICLE_LABELS[rate.vehicleType]}</h3></div>
      <FormField label="Rate per minute (INR)" type="number" step="0.01" min="0" value={f.ratePerMinute} onChange={(e) => setF({ ...f, ratePerMinute: e.target.value })} error={errors.ratePerMinute} />
      <FormField label="Convenience fee (INR)" type="number" step="0.01" min="0" value={f.convenienceFee} onChange={(e) => setF({ ...f, convenienceFee: e.target.value })} error={errors.convenienceFee} hint="Added once to each bill. Default is 0." />
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save rate'}</button>
    </form>
  );
}

export default function ManageRates() {
  const { data, loading, error, reload } = usePolling(() => adminService.rates(), [], 0);
  const [s, setS] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setS(data.settings); }, [data]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await adminService.updateSettings({ ...s, arrivalWindowMinutes: Number(s.arrivalWindowMinutes), releaseDelayMinutes: Number(s.releaseDelayMinutes) }); setErrors({}); toast.success('Rules saved'); reload(); }
    catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); }
    setBusy(false);
  };

  if (loading && !data) return <><PageHeader title="Rates and rules" /><SkeletonCards count={4} height={240} /></>;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <PageHeader title="Rates and rules" subtitle="Demo defaults: INR 2 per minute, 15-minute arrival window, 2-minute release delay." />
      <div className="alert alert-info" style={{ marginBottom: 24 }}><Info size={18} /><span>Changes apply to <b>new</b> check-ins and payments. A vehicle already parked keeps the rate saved when its session started.</span></div>
      <div className="rate-grid">{data.rates.map((r) => <RateCard key={`${r.vehicleType}-${r.ratePerMinute}-${r.convenienceFee}`} rate={r} onSaved={reload} />)}</div>
      {s && (
        <form className="card rules-card" onSubmit={saveSettings} noValidate>
          <div className="card-head"><h3>Booking rules</h3></div>
          <div className="form-grid">
            <FormField label="Reservation arrival window (minutes)" type="number" min="1" max="120" value={s.arrivalWindowMinutes} onChange={(e) => setS({ ...s, arrivalWindowMinutes: e.target.value })} error={errors.arrivalWindowMinutes} />
            <FormField label="Slot release delay after payment (minutes)" type="number" min="1" max="60" value={s.releaseDelayMinutes} onChange={(e) => setS({ ...s, releaseDelayMinutes: e.target.value })} error={errors.releaseDelayMinutes} hint="Enforced by the server. Minimum 1 minute." />
            <FormField className="span-2" label="Mall name" value={s.mallName} onChange={(e) => setS({ ...s, mallName: e.target.value })} />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={busy}>{busy ? 'Saving...' : 'Save rules'}</button>
        </form>
      )}
    </>
  );
}
