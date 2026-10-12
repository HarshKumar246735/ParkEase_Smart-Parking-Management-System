import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Logo } from '../common/Navbar.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

export default function DashboardSidebar({ links, user, onLogout, open, onNavigate, label }) {
  return (
    <>
      <div className={`side-overlay ${open ? 'show' : ''}`} onClick={onNavigate} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label={label}>
        <div className="sidebar-logo"><Logo dark /></div>
        <nav className="sidebar-nav">
          {links.map(({ to, label: text, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} aria-hidden="true" /> {text}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar" aria-hidden="true">{user?.name?.[0]?.toUpperCase() || '?'}</div>
          <div className="who">
            <strong>{user?.name}</strong>
            <StatusBadge kind="role" status={user?.role} />
          </div>
          <button className="btn btn-ghost btn-icon logout" onClick={onLogout} aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>
    </>
  );
}
