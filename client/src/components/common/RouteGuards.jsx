import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { FullLoader } from './Loader.jsx';

/** Any signed-in user. Redirects to login and remembers where the user was going. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullLoader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Admin only. The backend re-checks the role on every admin API call - this is just UX. */
export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullLoader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'ADMIN') return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

/** Login/Register pages: bounce signed-in users to their dashboard. */
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullLoader />;
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />;
  return <Outlet />;
}
