import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Layers } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/common/FormField.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { adminService } from '../../services/adminService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import '../../css/AdminManagement.css';

function FloorModal({ floor, onClose, onSaved }) {
  const [f, setF] = useState(floor || { name: '', code: '', description: '', order: 0, active: true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (floor) await adminService.updateFloor(floor.id, { ...f, order: Number(f.order) }); else await adminService.createFloor({ ...f, order: Number(f.order) });
      toast.success(floor ? 'Floor updated' : 'Floor created');
      onSaved();
    } catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); setBusy(false); }
  };
  return (
    <Modal title={floor ? `Edit ${floor.name}` : 'Add floor'} onClose={onClose} locked={busy}>
      <form className="form-grid" onSubmit={submit} noValidate>
        <FormField label="Name" value={f.name} onChange={set('name')} error={errors.name} placeholder="Basement 3" />
        <FormField label="Code" value={f.code} onChange={set('code')} error={errors.code} disabled={Boolean(floor)} placeholder="B3" hint={floor ? 'Codes cannot change because slot numbers use them.' : 'Used in slot numbers, e.g. B3-A-01'} />
        <FormField label="Display order" type="number" value={f.order} onChange={set('order')} />
        <FormField as="select" label="Status" value={String(f.active)} onChange={(e) => setF({ ...f, active: e.target.value === 'true' })} disabled={!floor}>
          <option value="true">Open</option><option value="false">Closed</option>
        </FormField>
        <FormField className="span-2" label="Description" value={f.description} onChange={set('description')} />
        <div className="span-2 modal-foot" style={{ padding: 0 }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save floor'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ManageFloors() {
  const { data, loading, error, reload } = usePolling(() => adminService.floors().then((d) => d.floors), [], 0);
  const [editing, setEditing] = useState(null);
  const columns = [
    { key: 'code', label: 'Code', strong: true },
    { key: 'name', label: 'Floor' },
    { key: 'description', label: 'Description', render: (f) => f.description || '-' },
    { key: 'order', label: 'Order' },
    { key: 'active', label: 'Status', render: (f) => <span className={`badge ${f.active ? 'badge-green' : 'badge-gray'}`}>{f.active ? 'Open' : 'Closed'}</span> },
    { key: 'act', label: '', align: 'right', render: (f) => <button className="btn btn-outline btn-sm" onClick={() => setEditing(f)}><Pencil size={14} /> Edit</button> },
  ];
  return (
    <>
      <PageHeader title="Floors" subtitle="Parking levels in the mall." actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Add floor</button>} />
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : <DataTable columns={columns} rows={data} loading={loading && !data} empty={{ icon: Layers, title: 'No floors yet', message: 'Add your first parking floor.' }} />}
      {editing && <FloorModal floor={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
