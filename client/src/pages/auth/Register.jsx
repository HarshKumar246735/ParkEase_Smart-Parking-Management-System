import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FormField from '../../components/common/FormField.jsx';
import { AuthShell } from './Login.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import '../../css/Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!/^\+?[0-9]{10,13}$/.test(form.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid phone number (10-13 digits)';
    if (form.password.length < 8) e.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) e.password = 'Include at least one letter and one number';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success('Account created. Welcome to ParkEase!');
      navigate('/app', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute." footer={<>Already registered? <Link to="/login">Sign in</Link></>}>
      <form onSubmit={submit} noValidate className="auth-form">
        <FormField label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <FormField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <FormField label="Phone number" type="tel" autoComplete="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <FormField label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters with a letter and a number." />
        <FormField label="Confirm password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
