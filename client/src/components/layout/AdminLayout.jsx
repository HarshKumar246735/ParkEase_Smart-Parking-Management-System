import { LayoutDashboard, Layers, LayoutGrid, ParkingSquare, Gauge, CalendarClock, Timer, Receipt, Users, BarChart3 } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/floors', label: 'Floors', icon: Layers },
  { to: '/admin/zones', label: 'Zones', icon: LayoutGrid },
  { to: '/admin/slots', label: 'Slots', icon: ParkingSquare },
  { to: '/admin/rates', label: 'Rates and rules', icon: Gauge },
  { to: '/admin/reservations', label: 'Reservations', icon: CalendarClock },
  { to: '/admin/sessions', label: 'Parking sessions', icon: Timer },
  { to: '/admin/payments', label: 'Payments', icon: Receipt },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];
export default function AdminLayout() {
  return <DashboardShell links={LINKS} label="Administration" />;
}
