import { useState } from 'react';
import { Users, Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable, { Pagination } from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { Skeleton } from '../../components/common/Loader.jsx';
import { adminService } from '../../services/adminService.js';
import { usePagedList } from '../../hooks/usePagedList.js';
import { usePolling } from '../../hooks/usePolling.js';
import { formatDate, formatDateTime, formatINR } from '../../utils/format.js';
import '../../css/AdminManagement.css';

function UserDetail({ id, onClose }) {
  const { data, loading, error } = usePolling(() => adminService.userDetail(id), [id], 0);
  return (
    <Modal title="User details" onClose={onClose} wide>
      {loading && !data ? <Skeleton height={240} /> : error ? <ErrorState message={error} /> : (
        <>
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{data.user.name}</dd></div>
            <div><dt>Email</dt><dd>{data.user.email}</dd></div>
            <div><dt>Phone</dt><dd>{data.user.phone}</dd></div>
            <div><dt>Joined</dt><dd>{formatDate(data.user.createdAt)}</dd></div>
          </dl>
          <h4>Vehicles ({data.vehicles.length})</h4>
          <p className="muted">{data.vehicles.map((v) => v.registrationNumber).join(', ') || 'None'}</p>
          <h4>Recent reservations</h4>
          <ul className="mini-list">{data.reservations.slice(0, 6).map((r) => <li key={r.id}><span className="num">{r.reservationNumber}</span><span>{r.slot?.slotNumber}</span><StatusBadge kind="reservation" status={r.status} /></li>)}{!data.reservations.length && <li className="muted">None</li>}</ul>
          <h4>Recent sessions</h4>
          <ul className="mini-list">{data.sessions.slice(0, 6).map((s) => <li key={s.id}><span className="num">{s.sessionNumber}</span><span>{formatDateTime(s.arrivalAt)}</span><span>{s.finalAmount != null ? formatINR(s.finalAmount) : '-'}</span></li>)}{!data.sessions.length && <li className="muted">None</li>}</ul>
          <h4>Payments</h4>
          <ul className="mini-list">{data.payments.slice(0, 6).map((p) => <li key={p.id}><span className="num">{p.transactionReference}</span><span>{formatINR(p.amount)}</span><StatusBadge kind="payment" status={p.status} /></li>)}{!data.payments.length && <li className="muted">None</li>}</ul>
        </>
      )}
    </Modal>
  );
}

export default function ManageUsers() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const { data, loading, error, reload, page, setPage } = usePagedList(adminService.users, q ? { q } : {}, 0);
  const columns = [
    { key: 'name', label: 'Name', strong: true },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (u) => <StatusBadge kind="role" status={u.role} /> },
    { key: 'joined', label: 'Joined', render: (u) => formatDate(u.createdAt) },
    { key: 'v', label: '', align: 'right', render: (u) => <button className="btn btn-outline btn-sm" onClick={() => setOpen(u.id)}>View activity</button> },
  ];
  return (
    <>
      <PageHeader title="Users" subtitle="Registered accounts. Passwords and tokens are never shown." />
      <div className="table-toolbar"><div className="search grow"><Search size={16} /><input className="input" aria-label="Search users" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.users} loading={loading && !data} empty={{ icon: Users, title: 'No users found' }} />
          {data && <Pagination page={page} pages={data.pages} total={data.total} onPage={setPage} />}
        </>
      )}
      {open && <UserDetail id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
