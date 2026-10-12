import { useState } from 'react';
import { Receipt, Search, Info } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable, { Pagination } from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import FormField from '../../components/common/FormField.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { adminService } from '../../services/adminService.js';
import { usePagedList } from '../../hooks/usePagedList.js';
import { formatDateTime, formatINR, METHOD_LABELS } from '../../utils/format.js';
import '../../css/AdminManagement.css';

export default function ManagePayments() {
  const [f, setF] = useState({ q: '', status: '' });
  const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
  const { data, loading, error, reload, page, setPage } = usePagedList(adminService.payments, clean, 20000);
  const columns = [
    { key: 'ref', label: 'Transaction', strong: true, render: (p) => <span className="num">{p.transactionReference}</span> },
    { key: 'user', label: 'User', render: (p) => p.user?.name || '-' },
    { key: 'inv', label: 'Invoice', render: (p) => <span className="num">{p.invoiceNumber}</span> },
    { key: 'slot', label: 'Slot / vehicle', render: (p) => `${p.session?.slotNumber || '-'} / ${p.session?.registrationNumber || '-'}` },
    { key: 'method', label: 'Method', render: (p) => `${METHOD_LABELS[p.method]} - ${p.provider}` },
    { key: 'date', label: 'Paid', render: (p) => formatDateTime(p.paidAt || p.createdAt) },
    { key: 'amt', label: 'Amount', align: 'right', strong: true, render: (p) => formatINR(p.amount) },
    { key: 'st', label: 'Status', render: (p) => <StatusBadge kind="payment" status={p.status} /> },
  ];
  return (
    <>
      <PageHeader title="Payments" subtitle="Read-only monitoring of demo payments." />
      <div className="alert alert-info" style={{ marginBottom: 20 }}><Info size={18} /><span>Payment status is set only by the server when a demo payment completes. Admins cannot create or edit payments.</span></div>
      <div className="table-toolbar filters">
        <div className="search grow"><Search size={16} /><input className="input" aria-label="Search by transaction reference" placeholder="Search transaction reference" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
        <FormField as="select" label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">All</option><option value="SUCCESS">Success</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option></FormField>
      </div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.payments} loading={loading && !data} empty={{ icon: Receipt, title: 'No payments yet', message: 'Payments appear after drivers pay their bills.' }} />
          {data && <Pagination page={page} pages={data.pages} total={data.total} onPage={setPage} />}
        </>
      )}
    </>
  );
}
