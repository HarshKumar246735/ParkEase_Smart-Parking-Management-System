import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from './DashboardSidebar.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import '../../css/Layout.css';

export default function DashboardShell({ links, label }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <DashboardSidebar links={links} user={user} label={label} open={open} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
      <div className="shell-main">
        <header className="topbar">
          <button className="btn btn-outline btn-icon topbar-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <span className="topbar-label">{label}</span>
        </header>
        <main className="shell-content" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
