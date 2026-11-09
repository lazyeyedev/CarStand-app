import { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';
import { PasswordField, PASSWORD_HINT } from './Form';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Shared by the buyer and dealer profiles. Fields are plain inputs rendered
// directly here (not a component declared inside the parent's render), which
// is what made the old buyer version lose focus on every keystroke.
export default function ChangePasswordCard() {
  const [pw, setPw] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => { setPw((p) => ({ ...p, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!pw.currentPassword) e.currentPassword = 'Enter your current password';
    if (pw.newPassword.length < 8) e.newPassword = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(pw.newPassword) || !/[0-9]/.test(pw.newPassword)) e.newPassword = 'Include at least one letter and one number';
    if (pw.confirmPassword !== pw.newPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await axiosInstance.put('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed');
      setPw(EMPTY);
    } catch (err) {
      const msg = err.response?.data?.message || 'Your password could not be changed';
      if (err.response?.status === 401) setErrors({ currentPassword: msg });
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" aria-labelledby="cp-h">
      <div className="card-head"><h2 id="cp-h" className="card-title">Change password</h2></div>
      <form onSubmit={submit} noValidate className="card-pad stack gap-4" style={{ maxWidth: 480 }}>
        <PasswordField label="Current password" autoComplete="current-password" value={pw.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
        <PasswordField label="New password" autoComplete="new-password" hint={PASSWORD_HINT} value={pw.newPassword} onChange={set('newPassword')} error={errors.newPassword} />
        <PasswordField label="Confirm new password" autoComplete="new-password" value={pw.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
        <div>
          <button type="submit" className="btn btn-secondary" disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : 'Update password'}
          </button>
        </div>
      </form>
    </section>
  );
}
