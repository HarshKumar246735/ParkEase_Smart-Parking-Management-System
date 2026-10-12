import { useState } from 'react';
import { Timer, Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable, { Pagination } from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import FormField from '../../components/common/FormField.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { adminService } from '../../services/adminService.js';
import { usePagedList } from '../../hooks/usePagedList.js';
import { formatDateTime, formatINR, formatMinutes } from '../../utils/format.js';
import '../../css/AdminManagement.css';

export default function ManageSessions() {
  const [f, setF] = useState({ q: '', status: '' });
  const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
  const { data, loading, error, reload, page, setPage } = usePagedList(adminService.sessions, clean, 15000);
  const columns = [
    { key: 'no', label: 'Session', strong: true, render: (s) => <span className="num">{s.sessionNumber}</span> },
    { key: 'veh', label: 'Vehicle', render: (s) => s.vehicle.registrationNumber },
    { key: 'slot', label: 'Slot', render: (s) => s.slot?.slotNumber },
    { key: 'arr', label: 'Arrival', render: (s) => formatDateTime(s.arrivalAt) },
    { key: 'dep', label: 'Departure', render: (s) => (s.departureAt ? formatDateTime(s.departureAt) : '-') },
    { key: 'dur', label: 'Duration', render: (s) => (s.billableMinutes ? formatMinutes(s.billableMinutes) : '-') },
    { key: 'bill', label: 'Final bill', align: 'right', strong: true, render: (s) => (s.finalAmount != null ? formatINR(s.finalAmount) : '-') },
    { key: 'rel', label: 'Release at', render: (s) => (s.status === 'PAID' ? formatDateTime(s.releaseAt) : s.completedAt ? `Released ${formatDateTime(s.completedAt)}` : '-') },
    { key: 'st', label: 'Status', render: (s) => <StatusBadge kind="session" status={s.status} /> },
  ];
  return (
    <>
      <PageHeader title="Parking sessions" subtitle="Active, completed and release-pending sessions with their finalized bills." />
      <div className="table-toolbar filters">
        <div className="search grow"><Search size={16} /><input className="input" aria-label="Search by vehicle registration or session ID" placeholder="Search vehicle or session ID" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
        <FormField as="select" label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">All</option><option value="ACTIVE">Parked</option><option value="PAYMENT_PENDING">Payment pending</option><option value="PAID">Release pending (paid)</option><option value="COMPLETED">Completed</option>
        </FormField>
      </div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.sessions} loading={loading && !data} empty={{ icon: Timer, title: 'No sessions found', message: 'Sessions appear after a driver checks in.' }} />
          {data && <Pagination page={page} pages={data.pages} total={data.total} onPage={setPage} />}
        </>
      )}
    </>
  );
}
