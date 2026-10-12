import { LayoutDashboard, ParkingSquare, CalendarClock, Timer, Car, History, Receipt, User } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';

const LINKS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/parking', label: 'Find parking', icon: ParkingSquare },
  { to: '/app/reservations', label: 'My reservations', icon: CalendarClock },
  { to: '/app/active', label: 'Active parking', icon: Timer },
  { to: '/app/vehicles', label: 'My vehicles', icon: Car },
  { to: '/app/history', label: 'Parking history', icon: History },
  { to: '/app/payments', label: 'Payments', icon: Receipt },
  { to: '/app/profile', label: 'Profile', icon: User },
];
export default function UserLayout() {
  return <DashboardShell links={LINKS} label="Visitor area" />;
}
