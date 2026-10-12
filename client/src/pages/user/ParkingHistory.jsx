import { useState } from 'react';
import { History } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable, { Pagination } from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import FormField from '../../components/common/FormField.jsx';
import { sessionService } from '../../services/sessionService.js';
import { usePolling } from '../../hooks/usePolling.js';
import { formatDateTime, formatINR, formatMinutes } from '../../utils/format.js';
import '../../css/ParkingHistory.css';

export default function ParkingHistory() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const { data, loading, error, reload } = usePolling(
    () => sessionService.history({ page, limit: 10, sort, ...(status ? { status } : {}) }),
    [page, status, sort], 0
  );

  const columns = [
    { key: 'slot', label: 'Slot', strong: true, render: (s) => s.slot?.slotNumber },
    { key: 'veh', label: 'Vehicle', render: (s) => s.vehicle.registrationNumber },
    { key: 'arr', label: 'Arrival', render: (s) => formatDateTime(s.arrivalAt) },
    { key: 'dep', label: 'Departure', render: (s) => (s.departureAt ? formatDateTime(s.departureAt) : 'Still parked') },
    { key: 'dur', label: 'Duration', render: (s) => (s.billableMinutes ? formatMinutes(s.billableMinutes) : '-') },
    { key: 'bill', label: 'Final bill', align: 'right', strong: true, render: (s) => (s.finalAmount != null ? formatINR(s.finalAmount) : s.live ? `${formatINR(s.live.estimatedCharge)} (est.)` : '-') },
    { key: 'st', label: 'Status', render: (s) => <StatusBadge kind="session" status={s.status} /> },
  ];

  return (
    <>
      <PageHeader title="Parking history" subtitle="Every visit, with arrival, departure and final bill." />
      <div className="table-toolbar">
        <div style={{ width: 200 }}><FormField as="select" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option><option value="ACTIVE">Parked</option><option value="PAYMENT_PENDING">Payment pending</option><option value="PAID">Paid</option><option value="COMPLETED">Completed</option>
        </FormField></div>
        <div style={{ width: 200 }}><FormField as="select" label="Sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
        </FormField></div>
      </div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.sessions} loading={loading && !data} empty={{ icon: History, title: 'No parking history', message: 'Your completed visits will be listed here.' }} />
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
        </>
      )}
    </>
  );
}
