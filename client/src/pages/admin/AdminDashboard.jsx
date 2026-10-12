import { ParkingSquare, CheckCircle2, CalendarClock, Car, Hourglass, Wrench, Timer, IndianRupee, Flag } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { SkeletonCards } from '../../components/common/Loader.jsx';
import { OccupancyChart, RevenueChart, SessionsChart, StatusPie, VehiclePie } from '../../components/admin/AdminCharts.jsx';
import { dashboardService } from '../../services/dashboardService.js';
import { usePolling } from '../../hooks/usePolling.js';
import { formatINR } from '../../utils/format.js';
import '../../css/AdminDashboard.css';

function Card({ icon: Icon, label, value, tone }) {
  return (
    <div className={`kpi kpi-${tone}`}>
      <span className="kpi-icon"><Icon size={18} /></span>
      <strong className="num">{value}</strong>
      <span className="kpi-label">{label}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = usePolling(() => dashboardService.admin({ days: 14 }), [], 15000);
  if (loading && !data) return <><PageHeader title="Overview" /><SkeletonCards count={8} height={104} /></>;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const { cards: c, charts } = data;
  return (
    <>
      <PageHeader title="Overview" subtitle="Live figures calculated from the database. Refreshes every 15 seconds." />
      <div className="kpi-grid">
        <Card icon={ParkingSquare} label="Total slots" value={c.totalSlots} tone="navy" />
        <Card icon={CheckCircle2} label="Available" value={c.available} tone="green" />
        <Card icon={CalendarClock} label="Reserved" value={c.reserved} tone="blue" />
        <Card icon={Car} label="Occupied" value={c.occupied} tone="red" />
        <Card icon={Hourglass} label="Release pending" value={c.releasePending} tone="orange" />
        <Card icon={Wrench} label="Maintenance" value={c.maintenance} tone="gray" />
        <Card icon={Timer} label="Active sessions" value={c.activeSessions} tone="teal" />
        <Card icon={Flag} label="Completed today" value={c.completedToday} tone="teal" />
        <Card icon={IndianRupee} label="Revenue today (demo)" value={formatINR(c.revenueToday)} tone="navy" />
      </div>
      <div className="chart-grid">
        <OccupancyChart data={charts.occupancyByFloor} />
        <StatusPie data={charts.statusDistribution} />
        <RevenueChart data={charts.revenueByDay} />
        <SessionsChart data={charts.sessionsByDay} />
        <VehiclePie data={charts.vehicleTypeDistribution} />
      </div>
    </>
  );
}
