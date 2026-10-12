import { useState } from 'react';
import { CalendarClock, Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable, { Pagination } from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import FormField from '../../components/common/FormField.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { adminService } from '../../services/adminService.js';
import { usePagedList } from '../../hooks/usePagedList.js';
import { formatDateTime } from '../../utils/format.js';
import '../../css/AdminManagement.css';

export default function ManageReservations() {
  const [f, setF] = useState({ q: '', status: '', date: '', sort: '' });
  const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
  const { data, loading, error, reload, page, setPage } = usePagedList(adminService.reservations, clean, 15000);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const columns = [
    { key: 'ref', label: 'Reservation', strong: true, render: (r) => <span className="num">{r.reservationNumber}</span> },
    { key: 'user', label: 'User', render: (r) => r.user?.name || '-' },
    { key: 'veh', label: 'Vehicle', render: (r) => r.vehicle.registrationNumber || '-' },
    { key: 'slot', label: 'Slot', render: (r) => r.slot?.slotNumber },
    { key: 'created', label: 'Booked', render: (r) => formatDateTime(r.createdAt) },
    { key: 'deadline', label: 'Arrival deadline', render: (r) => formatDateTime(r.expiresAt) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge kind="reservation" status={r.status} /> },
  ];
  return (
    <>
      <PageHeader title="Reservations" subtitle="Every booking, including expired and cancelled ones." />
      <div className="table-toolbar filters">
        <div className="search grow"><Search size={16} /><input className="input" aria-label="Search by reservation ID" placeholder="Search reservation ID" value={f.q} onChange={set('q')} /></div>
        <FormField as="select" label="Status" value={f.status} onChange={set('status')}><option value="">All</option><option value="ACTIVE">Active</option><option value="CHECKED_IN">Checked in</option><option value="EXPIRED">Expired</option><option value="CANCELLED">Cancelled</option></FormField>
        <FormField label="Booked on" type="date" value={f.date} onChange={set('date')} />
        <FormField as="select" label="Order" value={f.sort} onChange={set('sort')}><option value="">Newest first</option><option value="deadline">Earliest deadline</option></FormField>
      </div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.reservations} loading={loading && !data} empty={{ icon: CalendarClock, title: 'No reservations found', message: 'Try different filters.' }} />
          {data && <Pagination page={page} pages={data.pages} total={data.total} onPage={setPage} />}
        </>
      )}
    </>
  );
}
