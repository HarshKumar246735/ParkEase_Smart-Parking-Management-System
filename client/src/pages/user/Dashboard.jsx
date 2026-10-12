import { Link } from 'react-router-dom';
import { ParkingSquare, CalendarClock, Wallet, Car, Timer } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SkeletonCards } from '../../components/common/Loader.jsx';
import ActiveParkingCard from '../../components/sessions/ActiveParkingCard.jsx';
import ReservationCountdown from '../../components/reservations/ReservationCountdown.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import PlateChip from '../../components/common/PlateChip.jsx';
import VehicleIcon from '../../components/common/VehicleIcon.jsx';
import { dashboardService } from '../../services/dashboardService.js';
import { usePolling } from '../../hooks/usePolling.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatDateTime, formatINR, METHOD_LABELS, placeLabel } from '../../utils/format.js';
import '../../css/Dashboard.css';

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-icon"><Icon size={20} /></span>
      <div><p>{label}</p><strong className="num">{value}</strong></div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = usePolling(() => dashboardService.user(), [], 20000);

  if (loading && !data) return <><PageHeader title={`Welcome, ${user?.name?.split(' ')[0] || ''}`} /><SkeletonCards count={4} height={92} /></>;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const { stats, activeSession, activeReservations, recentPayments, recentVehicles, availability } = data;
  const occupiedPct = availability.total ? Math.round(((availability.total - availability.available) / availability.total) * 100) : 0;

  return (
    <>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`} subtitle="Here is what is happening with your parking." actions={<Link className="btn btn-primary" to="/app/parking"><ParkingSquare size={16} /> Find parking</Link>} />

      <div className="stat-grid">
        <Stat icon={Timer} label="Parking sessions" value={stats.totalSessions} tone="blue" />
        <Stat icon={CalendarClock} label="Active reservations" value={stats.activeReservations} tone="teal" />
        <Stat icon={Wallet} label="Total spent" value={formatINR(stats.totalSpent)} tone="navy" />
        <Stat icon={Car} label="Vehicles" value={stats.vehicles} tone="gray" />
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          {activeSession ? (
            activeSession.status === 'ACTIVE' ? <ActiveParkingCard session={activeSession} compact /> : (
              <div className="card"><div className="card-head"><h2>Parking in progress</h2><StatusBadge kind="session" status={activeSession.status} /></div>
                <p className="muted">Slot {activeSession.slot?.slotNumber} - {activeSession.status === 'PAYMENT_PENDING' ? 'your bill is ready to pay.' : 'payment done, slot is being released.'}</p>
                <Link className="btn btn-teal" style={{ marginTop: 16 }} to={activeSession.status === 'PAYMENT_PENDING' ? `/app/bill/${activeSession.id}` : `/app/success/${activeSession.paymentId}`}>{activeSession.status === 'PAYMENT_PENDING' ? 'Review and pay' : 'View status'}</Link>
              </div>
            )
          ) : activeReservations.length ? (
            <div className="card">
              <div className="card-head"><h2>Reservation waiting for you</h2></div>
              {activeReservations.map((r) => (
                <div className="dash-res" key={r.id}>
                  <div><strong className="dash-slot">{r.slot?.slotNumber}</strong><p className="muted">{placeLabel(r.slot)}</p><PlateChip number={r.vehicle.registrationNumber} /></div>
                  <ReservationCountdown createdAt={r.createdAt} expiresAt={r.expiresAt} onElapsed={reload} size="sm" />
                  <Link className="btn btn-teal" to={`/app/reservations/${r.id}`}>Open</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="card"><EmptyState icon={ParkingSquare} title="No active parking" message="Reserve a bay before you head to the mall and walk straight in." action={<Link className="btn btn-primary" to="/app/parking">Find parking</Link>} /></div>
          )}

          <div className="card">
            <div className="card-head"><h2>Recent transactions</h2><Link to="/app/payments" className="btn btn-ghost btn-sm">View all</Link></div>
            {recentPayments.length ? (
              <ul className="txn-list">
                {recentPayments.map((p) => (
                  <li key={p.id}>
                    <div><strong className="num">{p.transactionReference}</strong><span className="muted">{formatDateTime(p.paidAt)} - {METHOD_LABELS[p.method]}</span></div>
                    <strong className="num">{formatINR(p.amount)}</strong>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">No transactions yet.</p>}
          </div>
        </div>

        <div className="dash-side">
          <div className="card">
            <div className="card-head"><h2>Mall parking now</h2></div>
            <p className="avail-big num">{availability.available}<span> of {availability.total} bays free</span></p>
            <div className="meter" aria-hidden="true"><span style={{ width: `${occupiedPct}%` }} /></div>
            <dl className="detail-list">
              <div><dt>Occupied</dt><dd>{availability.occupied}</dd></div>
              <div><dt>Reserved</dt><dd>{availability.reserved}</dd></div>
              <div><dt>Releasing</dt><dd>{availability.releasePending}</dd></div>
            </dl>
          </div>
          <div className="card">
            <div className="card-head"><h2>Recent vehicles</h2><Link to="/app/vehicles" className="btn btn-ghost btn-sm">Manage</Link></div>
            {recentVehicles.length ? (
              <ul className="rv-list">{recentVehicles.map((v) => <li key={v.id}><VehicleIcon type={v.vehicleType} /><PlateChip number={v.registrationNumber} /><span className="muted">{v.brand} {v.model}</span></li>)}</ul>
            ) : <p className="muted">Vehicles you park with will show up here.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
