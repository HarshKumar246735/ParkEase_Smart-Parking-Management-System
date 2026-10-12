import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Wrench, RotateCcw, ParkingSquare } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/common/FormField.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { adminService } from '../../services/adminService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import { SLOT_TYPE_LABELS } from '../../utils/format.js';
import '../../css/AdminManagement.css';

function AddSlotsModal({ zones, onClose, onSaved }) {
  const [f, setF] = useState({ zoneId: zones[0]?.id || '', slotType: 'STANDARD', count: 1 });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { const r = await adminService.createSlots({ ...f, count: Number(f.count) }); toast.success(`Added ${r.created.join(', ')}`); onSaved(); }
    catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); setBusy(false); }
  };
  return (
    <Modal title="Add parking slots" onClose={onClose} locked={busy}>
      <form className="form-grid" onSubmit={submit} noValidate>
        <FormField className="span-2" as="select" label="Zone" value={f.zoneId} onChange={(e) => setF({ ...f, zoneId: e.target.value })} error={errors.zoneId}>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.floor?.name} - {z.name}</option>)}
        </FormField>
        <FormField as="select" label="Slot type" value={f.slotType} onChange={(e) => setF({ ...f, slotType: e.target.value })} error={errors.slotType}>
          {Object.entries(SLOT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </FormField>
        <FormField label="How many" type="number" min="1" max="50" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} error={errors.count} hint="Numbers continue from the last slot in the zone." />
        <div className="span-2 modal-foot" style={{ padding: 0 }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Adding...' : 'Add slots'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ManageSlots() {
  const [filters, setFilters] = useState({ floorId: '', zoneId: '', status: '', slotType: '' });
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const floors = usePolling(() => adminService.floors().then((d) => d.floors), [], 0);
  const zones = usePolling(() => adminService.zones({}).then((d) => d.zones), [], 0);
  const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const { data, loading, error, reload } = usePolling(() => adminService.slots(clean).then((d) => d.slots), [JSON.stringify(clean)], 10000);
  const zoneOptions = (zones.data || []).filter((z) => !filters.floorId || z.floorId === filters.floorId);

  const act = async (slot, fn, okMsg) => {
    setBusyId(slot.id);
    try { await fn(slot.id); toast.success(okMsg); } catch (e) { toast.error(getErrorMessage(e)); }
    setBusyId(null); reload();
  };
  const changeType = async (slot, slotType) => {
    setBusyId(slot.id);
    try { await adminService.updateSlot(slot.id, { slotType }); toast.success('Slot type updated'); } catch (e) { toast.error(getErrorMessage(e)); }
    setBusyId(null); reload();
  };

  const columns = [
    { key: 'slotNumber', label: 'Slot', strong: true },
    { key: 'floor', label: 'Floor / zone', render: (s) => `${s.floor.name} / ${s.zone.name}` },
    { key: 'type', label: 'Type', render: (s) => (
      <select className="select select-sm" aria-label={`Type of ${s.slotNumber}`} value={s.slotType} disabled={busyId === s.id || !['AVAILABLE', 'MAINTENANCE'].includes(s.status)} onChange={(e) => changeType(s, e.target.value)}>
        {Object.entries(SLOT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    ) },
    { key: 'status', label: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'act', label: 'Actions', align: 'right', render: (s) => (
      s.status === 'MAINTENANCE'
        ? <button className="btn btn-outline btn-sm" disabled={busyId === s.id} onClick={() => act(s, adminService.restoreSlot, `${s.slotNumber} restored to service`)}><RotateCcw size={14} /> Restore</button>
        : <button className="btn btn-outline btn-sm" disabled={busyId === s.id || s.status !== 'AVAILABLE'} title={s.status !== 'AVAILABLE' ? 'Only free slots can go into maintenance' : ''} onClick={() => act(s, adminService.setMaintenance, `${s.slotNumber} set to maintenance`)}><Wrench size={14} /> Maintenance</button>
    ) },
  ];
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value, ...(k === 'floorId' ? { zoneId: '' } : {}) });

  return (
    <>
      <PageHeader title="Parking slots" subtitle="Status is controlled by the booking and payment flow. Admins can only change type or maintenance." actions={<button className="btn btn-primary" onClick={() => setAdding(true)} disabled={!zones.data?.length}><Plus size={16} /> Add slots</button>} />
      <div className="table-toolbar filters">
        <FormField as="select" label="Floor" value={filters.floorId} onChange={set('floorId')}><option value="">All floors</option>{floors.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</FormField>
        <FormField as="select" label="Zone" value={filters.zoneId} onChange={set('zoneId')}><option value="">All zones</option>{zoneOptions.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</FormField>
        <FormField as="select" label="Status" value={filters.status} onChange={set('status')}><option value="">All statuses</option>{['AVAILABLE', 'RESERVED', 'OCCUPIED', 'RELEASE_PENDING', 'MAINTENANCE'].map((s) => <option key={s} value={s}>{s.replace('_', ' ').toLowerCase()}</option>)}</FormField>
        <FormField as="select" label="Type" value={filters.slotType} onChange={set('slotType')}><option value="">All types</option>{Object.entries(SLOT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</FormField>
      </div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : <DataTable columns={columns} rows={data} loading={loading && !data} empty={{ icon: ParkingSquare, title: 'No slots match', message: 'Change the filters or add slots to a zone.' }} />}
      {adding && <AddSlotsModal zones={zones.data || []} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
    </>
  );
}
