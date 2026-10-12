import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import FormField from '../../components/common/FormField.jsx';
import { SkeletonCards } from '../../components/common/Loader.jsx';
import { OccupancyChart, RevenueChart, SessionsChart, StatusPie, VehiclePie } from '../../components/admin/AdminCharts.jsx';
import { adminService } from '../../services/adminService.js';
import { usePolling } from '../../hooks/usePolling.js';
import { formatINR } from '../../utils/format.js';
import '../../css/Reports.css';

export default function Reports() {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = usePolling(() => adminService.reports({ days }), [days], 0);
  const totals = data && {
    revenue: data.charts.revenueByDay.reduce((a, d) => a + d.revenue, 0),
    payments: data.charts.revenueByDay.reduce((a, d) => a + d.payments, 0),
    sessions: data.charts.sessionsByDay.reduce((a, d) => a + d.sessions, 0),
  };
  return (
    <>
      <PageHeader title="Reports" subtitle="Revenue and parking activity from successful demo payments and recorded sessions." actions={
        <div style={{ width: 180 }}><FormField as="select" label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
        </FormField></div>
      } />
      {loading && !data ? <SkeletonCards count={3} height={110} /> : error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="rep-totals">
            <div className="card"><span className="muted">Revenue ({days} days)</span><strong className="num">{formatINR(totals.revenue)}</strong></div>
            <div className="card"><span className="muted">Successful payments</span><strong className="num">{totals.payments}</strong></div>
            <div className="card"><span className="muted">Sessions started</span><strong className="num">{totals.sessions}</strong></div>
            <div className="card"><span className="muted">All-time revenue</span><strong className="num">{formatINR(data.cards.totalRevenue)}</strong></div>
          </div>
          <div className="chart-grid">
            <RevenueChart data={data.charts.revenueByDay} />
            <SessionsChart data={data.charts.sessionsByDay} />
            <OccupancyChart data={data.charts.occupancyByFloor} />
            <StatusPie data={data.charts.statusDistribution} />
            <VehiclePie data={data.charts.vehicleTypeDistribution} />
          </div>
        </>
      )}
    </>
  );
}
