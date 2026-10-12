import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import ChartCard from './ChartCard.jsx';
import { VEHICLE_LABELS } from '../../utils/format.js';

export const STATUS_COLORS = { AVAILABLE: '#16a34a', RESERVED: '#2f6bff', OCCUPIED: '#e5484d', RELEASE_PENDING: '#f97316', MAINTENANCE: '#7b879d' };
const STATUS_LABELS = { AVAILABLE: 'Available', RESERVED: 'Reserved', OCCUPIED: 'Occupied', RELEASE_PENDING: 'Release pending', MAINTENANCE: 'Maintenance' };
const VEHICLE_COLORS = ['#0b1b3a', '#12b5a6', '#2f6bff', '#f59e0b'];
const short = (d) => (d ? d.slice(5) : '');
const axis = { fontSize: 12, fill: '#6b7a96' };
const tip = { contentStyle: { borderRadius: 10, border: '1px solid #e1e7f1', fontSize: 13 } };

export function OccupancyChart({ data }) {
  return (
    <ChartCard title="Occupancy by floor" subtitle="Bays by status" empty={!data?.length}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -16, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
          <XAxis dataKey="floor" tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tip} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="available" name="Available" stackId="a" fill={STATUS_COLORS.AVAILABLE} />
          <Bar dataKey="reserved" name="Reserved" stackId="a" fill={STATUS_COLORS.RESERVED} />
          <Bar dataKey="occupied" name="Occupied" stackId="a" fill={STATUS_COLORS.OCCUPIED} />
          <Bar dataKey="releasePending" name="Release pending" stackId="a" fill={STATUS_COLORS.RELEASE_PENDING} />
          <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill={STATUS_COLORS.MAINTENANCE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RevenueChart({ data }) {
  const empty = !data?.some((d) => d.revenue > 0);
  return (
    <ChartCard title="Revenue by day" subtitle="Successful demo payments (INR)" empty={empty}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -8, right: 8 }}>
          <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#12b5a6" stopOpacity={0.35} /><stop offset="100%" stopColor="#12b5a6" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
          <XAxis dataKey="date" tickFormatter={short} tick={axis} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tip} formatter={(v) => [`₹${v}`, 'Revenue']} />
          <Area type="monotone" dataKey="revenue" stroke="#0a9488" strokeWidth={2.5} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SessionsChart({ data }) {
  const empty = !data?.some((d) => d.sessions > 0);
  return (
    <ChartCard title="Parking sessions by day" empty={empty}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -16, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
          <XAxis dataKey="date" tickFormatter={short} tick={axis} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tip} />
          <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#2f6bff" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function Donut({ data, nameKey, colors, labels }) {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey={nameKey} innerRadius="55%" outerRadius="82%" paddingAngle={2}>
          {data.map((d, i) => <Cell key={d[nameKey]} fill={colors[d[nameKey]] || colors[i % colors.length]} />)}
        </Pie>
        <Tooltip {...tip} formatter={(v, n) => [v, labels?.[n] || n]} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} formatter={(v) => labels?.[v] || v} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StatusPie({ data }) {
  const rows = data?.filter((d) => d.value > 0) || [];
  return <ChartCard title="Slot distribution" subtitle="By current status" empty={!rows.length}><Donut data={rows} nameKey="status" colors={STATUS_COLORS} labels={STATUS_LABELS} /></ChartCard>;
}

export function VehiclePie({ data }) {
  return <ChartCard title="Vehicle types" subtitle="Across all parking sessions" empty={!data?.length}><Donut data={data || []} nameKey="type" colors={VEHICLE_COLORS} labels={VEHICLE_LABELS} /></ChartCard>;
}
