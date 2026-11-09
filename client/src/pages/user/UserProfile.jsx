import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CarCard from '../../components/CarCard';
import Icon from '../../components/Icon';
import { Field } from '../../components/Form';
import ChangePasswordCard from '../../components/ChangePasswordCard';
import { PageHeader, EmptyState } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    axiosInstance.get('/auth/me').then((r) => {
      setProfile(r.data.user);
      setForm({ name: r.data.user.name || '', phone: r.data.user.phone || '' });
    }).catch(() => toast.error('Your profile could not be loaded')).finally(() => setLoading(false));
  }, []);

  const pickAvatar = (file) => {
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      if (form.name) fd.append('name', form.name);
      if (form.phone) fd.append('phone', form.phone);
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await axiosInstance.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(data);
      setAvatarFile(null);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Your profile could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const avatar = avatarPreview || profile?.avatar;
  const initials = profile?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const saved = profile?.savedListings?.filter((l) => l && typeof l === 'object') || [];

  return (
    <div className="page">
      <Navbar />
      <main id="main" className="page-main container section-sm" style={{ maxWidth: 920 }}>
        <PageHeader
          title="My profile"
          subtitle="Your contact details are shared with dealers when you send an enquiry."
          actions={<Link to="/profile/enquiries" className="btn btn-secondary"><Icon name="message" /> My enquiries</Link>}
        />

        {loading ? (
          <div className="stack gap-4">{[200, 260].map((h) => <div key={h} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-md)' }} />)}</div>
        ) : (
          <div className="stack gap-6">
            <section className="card" aria-labelledby="acct-h">
              <div className="card-head"><h2 id="acct-h" className="card-title">Account details</h2></div>
              <form onSubmit={handleSave} noValidate className="card-pad">
                <div className="row wrap gap-6" style={{ alignItems: 'flex-start' }}>
                  <label className="stack gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                    {avatar
                      ? <img src={avatar} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                      : <span className="avatar" style={{ width: 96, height: 96, fontSize: '1.6rem' }}>{initials}</span>}
                    <span className="text-sm red" style={{ fontWeight: 600 }}>{avatar ? 'Change photo' : 'Add photo'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickAvatar(e.target.files[0])} />
                  </label>
                  <div className="grow stack gap-4" style={{ minWidth: 240 }}>
                    <Field label="Full name" autoComplete="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    <Field label="Email" value={profile?.email || ''} disabled hint="Your email can't be changed here." />
                    <Field label="Phone" type="tel" autoComplete="tel" placeholder="0244 000 000" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                    <div>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <><span className="spinner" /> Saving…</> : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </section>

            <ChangePasswordCard />

            <section aria-labelledby="saved-h">
              <div className="section-head"><h2 id="saved-h" style={{ fontSize: 'var(--fs-xl)' }}>Saved cars</h2></div>
              {saved.length > 0 ? (
                <div className="grid-cards">{saved.map((l) => <CarCard key={l._id} listing={l} />)}</div>
              ) : (
                <div className="card">
                  <EmptyState icon="star" title="No saved cars yet" action={<Link to="/listings" className="btn btn-secondary">Browse cars</Link>}>
                    Cars you save will appear here so you can come back to them.
                  </EmptyState>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
