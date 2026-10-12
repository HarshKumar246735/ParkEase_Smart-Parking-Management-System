import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import '../../css/Errors.css';

export default function Unauthorized() {
  const { user } = useAuth();
  return (
    <div className="err-page">
      <div className="err-card">
        <div className="err-icon"><ShieldCheck size={30} /></div>
        <h1>Administrators only</h1>
        <p>Your account does not have access to this area. If you think this is a mistake, sign in with an administrator account.</p>
        <Link className="btn btn-primary" to={user ? '/app' : '/login'}>{user ? 'Go to my dashboard' : 'Sign in'}</Link>
      </div>
    </div>
  );
}
