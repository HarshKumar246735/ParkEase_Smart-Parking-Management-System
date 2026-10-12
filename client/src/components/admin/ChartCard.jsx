import EmptyState from '../common/EmptyState.jsx';
import { BarChart3 } from 'lucide-react';

export default function ChartCard({ title, subtitle, empty, children, height = 280 }) {
  return (
    <div className="card chart-card">
      <div className="card-head"><div><h3>{title}</h3>{subtitle && <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{subtitle}</p>}</div></div>
      {empty ? <EmptyState icon={BarChart3} title="No data yet" message="This chart fills in as parking activity happens." /> : <div style={{ width: '100%', height }}>{children}</div>}
    </div>
  );
}
