import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Receipt } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable, { Pagination } from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { paymentService } from '../../services/paymentService.js';
import { getErrorMessage } from '../../services/api.js';
import { usePolling } from '../../hooks/usePolling.js';
import { formatDateTime, formatINR, METHOD_LABELS } from '../../utils/format.js';
import '../../css/PaymentHistory.css';

export default function PaymentHistory() {
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const { data, loading, error, reload } = usePolling(() => paymentService.history({ page, limit: 10 }), [page], 0);

  const download = async (p) => {
    setBusy(p.id);
    try { await paymentService.downloadReceipt(p.id, p.receiptNumber); toast.success('Receipt downloaded'); }
    catch (e) { toast.error(getErrorMessage(e)); }
    setBusy(null);
  };

  const columns = [
    { key: 'ref', label: 'Transaction', render: (p) => <span className="num strong">{p.transactionReference}</span> },
    { key: 'date', label: 'Date', render: (p) => formatDateTime(p.paidAt || p.createdAt) },
    { key: 'session', label: 'Slot / vehicle', render: (p) => `${p.session?.slotNumber || '-'} / ${p.session?.registrationNumber || '-'}` },
    { key: 'method', label: 'Method', render: (p) => `${METHOD_LABELS[p.method]} - ${p.provider}` },
    { key: 'amount', label: 'Amount', align: 'right', strong: true, render: (p) => formatINR(p.amount) },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge kind="payment" status={p.status} /> },
    { key: 'receipt', label: 'Receipt', align: 'right', render: (p) => p.status === 'SUCCESS' ? <button className="btn btn-outline btn-sm" onClick={() => download(p)} disabled={busy === p.id}><Download size={14} /> {busy === p.id ? '...' : 'Receipt'}</button> : '-' },
  ];

  return (
    <>
      <PageHeader title="Payment history" subtitle="All your demo transactions, with downloadable receipts." />
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.payments} loading={loading && !data} empty={{ icon: Receipt, title: 'No payments yet', message: 'Once you pay a parking bill it will appear here.' }} />
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
        </>
      )}
    </>
  );
}
