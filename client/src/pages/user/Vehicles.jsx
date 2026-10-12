import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Car } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import FormField from '../../components/common/FormField.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import PlateChip from '../../components/common/PlateChip.jsx';
import VehicleIcon from '../../components/common/VehicleIcon.jsx';
import { SkeletonCards } from '../../components/common/Loader.jsx';
import { vehicleService } from '../../services/vehicleService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import { VEHICLE_LABELS } from '../../utils/format.js';
import '../../css/Vehicles.css';

const BLANK = { registrationNumber: '', vehicleType: 'CAR', brand: '', model: '', color: '', nickname: '' };

function VehicleModal({ vehicle, onClose, onSaved }) {
  const [form, setForm] = useState(vehicle ? { ...BLANK, ...vehicle } : BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!/^[A-Za-z0-9 -]{4,16}$/.test(form.registrationNumber.trim())) e.registrationNumber = 'Enter a valid registration number';
    if (!form.brand.trim()) e.brand = 'Enter the brand';
    if (!form.model.trim()) e.model = 'Enter the model';
    if (!form.color.trim()) e.color = 'Enter the colour';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      if (vehicle) await vehicleService.update(vehicle.id, form); else await vehicleService.create(form);
      toast.success(vehicle ? 'Vehicle updated' : 'Vehicle added');
      onSaved();
    } catch (e) {
      setErrors(getFieldErrors(e));
      toast.error(getErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Modal title={vehicle ? 'Edit vehicle' : 'Add a vehicle'} onClose={onClose} locked={busy}>
      <form onSubmit={submit} noValidate className="form-grid">
        <FormField className="span-2" label="Registration number" placeholder="DL 8C AB 1234" value={form.registrationNumber} onChange={set('registrationNumber')} error={errors.registrationNumber} hint="Spaces and dashes are removed automatically." />
        <FormField as="select" label="Vehicle type" value={form.vehicleType} onChange={set('vehicleType')} error={errors.vehicleType}>
          {Object.entries(VEHICLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </FormField>
        <FormField label="Nickname (optional)" placeholder="Daily driver" value={form.nickname} onChange={set('nickname')} error={errors.nickname} />
        <FormField label="Brand" placeholder="Hyundai" value={form.brand} onChange={set('brand')} error={errors.brand} />
        <FormField label="Model" placeholder="Creta" value={form.model} onChange={set('model')} error={errors.model} />
        <FormField className="span-2" label="Colour" placeholder="White" value={form.color} onChange={set('color')} error={errors.color} />
        <div className="span-2 modal-foot" style={{ padding: 0 }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : vehicle ? 'Save changes' : 'Add vehicle'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Vehicles() {
  const { data, loading, error, reload } = usePolling(() => vehicleService.list().then((d) => d.vehicles), [], 0);
  const [editing, setEditing] = useState(null); // null | 'new' | vehicle
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try { await vehicleService.remove(toDelete.id); toast.success('Vehicle removed'); reload(); }
    catch (e) { toast.error(getErrorMessage(e)); }
    setDeleting(false); setToDelete(null);
  };

  return (
    <>
      <PageHeader title="My vehicles" subtitle="Vehicles you can reserve and park with." actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Add vehicle</button>} />
      {loading && !data ? <SkeletonCards count={3} height={180} /> : error && !data ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? (
        <div className="card"><EmptyState icon={Car} title="No vehicles yet" message="Add your car, bike, SUV or EV so you can reserve a bay in seconds." action={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Add your first vehicle</button>} /></div>
      ) : (
        <div className="veh-grid">
          {data.map((v) => (
            <article className="veh-card" key={v.id}>
              <div className="veh-top">
                <span className="veh-icon"><VehicleIcon type={v.vehicleType} size={24} /></span>
                <StatusBadge kind="vehicle" status={v.status} />
              </div>
              <PlateChip number={v.registrationNumber} large />
              <div className="veh-info">
                <strong>{v.nickname || `${v.brand} ${v.model}`}</strong>
                <span className="muted">{v.brand} {v.model} - {v.color} - {VEHICLE_LABELS[v.vehicleType]}</span>
              </div>
              <div className="veh-actions">
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(v)}><Pencil size={14} /> Edit</button>
                <button className="btn btn-danger-outline btn-sm" onClick={() => setToDelete(v)}><Trash2 size={14} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && <VehicleModal vehicle={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {toDelete && <ConfirmDialog title="Delete this vehicle?" message={`${toDelete.registrationNumber} will be removed from your account. Past parking history is kept.`} confirmLabel="Delete vehicle" danger busy={deleting} onConfirm={remove} onCancel={() => setToDelete(null)} />}
    </>
  );
}
