import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../../components/common/Navbar.jsx';
import FormField from '../../components/common/FormField.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import '../../css/Auth.css';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Logo />
        <div className="auth-pitch">
          <h2>Your bay is waiting.</h2>
          <p>Reserve before you leave home, park, and pay in seconds.</p>
          <div className="auth-bays" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <span key={i} className={i % 4 === 1 ? 'occ' : i % 5 === 3 ? 'res' : ''} />)}</div>
        </div>
        <p className="auth-demo">Demo project - no real payments.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth-foot">{footer}</p>
        </div>
      </main>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) found.email = 'Enter a valid email address';
    if (!form.password) found.password = 'Enter your password';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(location.state?.from || (user.role === 'ADMIN' ? '/admin' : '/app'), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to ParkEase." footer={<>New here? <Link to="/register">Create an account</Link></>}>
      <form onSubmit={submit} noValidate className="auth-form">
        <FormField label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <div className="field">
          <FormField label="Password" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
          <button type="button" className="btn btn-ghost btn-sm show-pw" onClick={() => setShow((s) => !s)}>{show ? <EyeOff size={16} /> : <Eye size={16} />} {show ? 'Hide' : 'Show'} password</button>
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </AuthShell>
  );
}
