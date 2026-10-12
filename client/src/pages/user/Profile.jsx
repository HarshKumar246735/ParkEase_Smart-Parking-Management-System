import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import FormField from '../../components/common/FormField.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { authService } from '../../services/authService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatDate } from '../../utils/format.js';
import '../../css/Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { user: u } = await authService.updateProfile(form);
      updateUser(u);
      setErrors({});
      toast.success('Profile updated');
    } catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." />
      <div className="profile-grid">
        <form className="card form-grid" onSubmit={submit} noValidate>
          <FormField className="span-2" label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <FormField className="span-2" label="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
          <FormField className="span-2" label="Email" value={user.email} disabled hint="Email cannot be changed in this demo." readOnly />
          <div className="span-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
        </form>
        <div className="card">
          <dl className="detail-list">
            <div><dt>Role</dt><dd><StatusBadge kind="role" status={user.role} /></dd></div>
            <div><dt>Member since</dt><dd>{formatDate(user.createdAt)}</dd></div>
          </dl>
        </div>
      </div>
    </>
  );
}
