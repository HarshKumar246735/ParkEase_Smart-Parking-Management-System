import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, LayoutGrid } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/common/FormField.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { adminService } from '../../services/adminService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import '../../css/AdminManagement.css';

function ZoneModal({ zone, floors, onClose, onSaved }) {
  const [f, setF] = useState(zone || { floorId: floors[0]?.id || '', name: '', code: '', description: '', active: true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (zone) await adminService.updateZone(zone.id, f); else await adminService.createZone(f);
      toast.success(zone ? 'Zone updated' : 'Zone created');
      onSaved();
    } catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); setBusy(false); }
  };
  return (
    <Modal title={zone ? `Edit ${zone.name}` : 'Add zone'} onClose={onClose} locked={busy}>
      <form className="form-grid" onSubmit={submit} noValidate>
        <FormField as="select" label="Floor" value={f.floorId} onChange={set('floorId')} error={errors.floorId} disabled={Boolean(zone)}>
          {floors.map((fl) => <option key={fl.id} value={fl.id}>{fl.name}</option>)}
        </FormField>
        <FormField label="Code" value={f.code} onChange={set('code')} error={errors.code} disabled={Boolean(zone)} placeholder="D" />
        <FormField className="span-2" label="Name" value={f.name} onChange={set('name')} error={errors.name} placeholder="Zone D" />
        <FormField className="span-2" label="Description" value={f.description} onChange={set('description')} />
        {zone && <FormField as="select" label="Status" value={String(f.active)} onChange={(e) => setF({ ...f, active: e.target.value === 'true' })}><option value="true">Open</option><option value="false">Closed</option></FormField>}
        <div className="span-2 modal-foot" style={{ padding: 0 }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save zone'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ManageZones() {
  const [floorId, setFloorId] = useState('');
  const floors = usePolling(() => adminService.floors().then((d) => d.floors), [], 0);
  const { data, loading, error, reload } = usePolling(() => adminService.zones(floorId ? { floorId } : {}).then((d) => d.zones), [floorId], 0);
  const [editing, setEditing] = useState(null);
  const columns = [
    { key: 'floor', label: 'Floor', render: (z) => z.floor?.name },
    { key: 'code', label: 'Code', strong: true },
    { key: 'name', label: 'Zone' },
    { key: 'description', label: 'Description', render: (z) => z.description || '-' },
    { key: 'active', label: 'Status', render: (z) => <span className={`badge ${z.active ? 'badge-green' : 'badge-gray'}`}>{z.active ? 'Open' : 'Closed'}</span> },
    { key: 'act', label: '', align: 'right', render: (z) => <button className="btn btn-outline btn-sm" onClick={() => setEditing(z)}><Pencil size={14} /> Edit</button> },
  ];
  return (
    <>
      <PageHeader title="Zones" subtitle="Sections within each floor." actions={<button className="btn btn-primary" onClick={() => setEditing('new')} disabled={!floors.data?.length}><Plus size={16} /> Add zone</button>} />
      <div className="table-toolbar"><div style={{ width: 220 }}>
        <FormField as="select" label="Floor" value={floorId} onChange={(e) => setFloorId(e.target.value)}><option value="">All floors</option>{floors.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</FormField>
      </div></div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : <DataTable columns={columns} rows={data} loading={loading && !data} empty={{ icon: LayoutGrid, title: 'No zones', message: 'Add a zone to a floor, then add slots to it.' }} />}
      {editing && <ZoneModal zone={editing === 'new' ? null : editing} floors={floors.data || []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
