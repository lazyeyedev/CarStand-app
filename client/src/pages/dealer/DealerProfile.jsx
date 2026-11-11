import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import DealerLayout from './DealerLayout';
import Icon from '../../components/Icon';
import { Field } from '../../components/Form';
import ChangePasswordCard from '../../components/ChangePasswordCard';
import { PageHeader } from '../../components/DashboardShell';
import { REGIONS } from '../../utils/options';
import axiosInstance from '../../api/axiosInstance';

const TIER_BADGE = { basic: '', pro: 'badge-red', premium: 'badge-solid' };

export default function DealerProfile() {
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ businessName: '', businessAddress: '', region: '', phone: '', whatsapp: '', description: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    axiosInstance.get('/dealers/profile')
      .then((r) => {
        setDealer(r.data);
        setForm({
          businessName: r.data.businessName || '',
          businessAddress: r.data.businessAddress || '',
          region: r.data.region || '',
          phone: r.data.phone || '',
          whatsapp: r.data.whatsapp || '',
          description: r.data.description || '',
        });
      })
      .catch(() => toast.error('Your profile could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  const pick = (file, setFile, setPreview) => {
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      if (coverFile) fd.append('coverImage', coverFile);
      const { data } = await axiosInstance.put('/dealers/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDealer(data);
      setLogoFile(null);
      setCoverFile(null);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Your profile could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const tier = dealer?.subscriptionTier || 'basic';
  const cover = coverPreview || dealer?.coverImage;
  const logo = logoPreview || dealer?.logo;

  return (
    <DealerLayout>
      <div style={{ maxWidth: 880 }}>
        <PageHeader title="Dealer profile" subtitle="This is what buyers see on your listings." />

        {loading ? (
          <div className="stack gap-4">{[220, 300].map((h) => <div key={h} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-md)' }} />)}</div>
        ) : (
          <div className="stack gap-6">
            <form onSubmit={handleSave} noValidate className="stack gap-6">
              <section className="card" style={{ overflow: 'hidden' }} aria-label="Branding">
                <label style={{ display: 'block', position: 'relative', height: 170, cursor: 'pointer',
                  background: cover ? `center / cover no-repeat url("${cover}")` : 'radial-gradient(500px 200px at 80% 0%, rgba(196,30,42,.25), transparent 70%), var(--color-surface-2)' }}>
                  <span className="btn btn-secondary btn-sm" style={{ position: 'absolute', right: 12, bottom: 12, background: 'rgba(10,10,10,.75)' }}>
                    <Icon name="image" /> {cover ? 'Change cover' : 'Add cover image'}
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files[0], setCoverFile, setCoverPreview)} />
                </label>
                <div className="card-pad row wrap gap-4" style={{ marginTop: -56 }}>
                  <label style={{ cursor: 'pointer', position: 'relative' }} aria-label="Change logo">
                    {logo
                      ? <img src={logo} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--color-surface)' }} />
                      : <span className="avatar" style={{ width: 96, height: 96, fontSize: '1.8rem', border: '4px solid var(--color-surface)' }}>{form.businessName?.[0] || '+'}</span>}
                    <span className="avatar" style={{ position: 'absolute', right: 0, bottom: 4, width: 30, height: 30, background: 'var(--red)', color: '#fff', border: '2px solid var(--color-surface)' }}><Icon name="edit" size={14} /></span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files[0], setLogoFile, setLogoPreview)} />
                  </label>
                  <div className="grow" style={{ paddingTop: 56 }}>
                    <div className="row wrap gap-2">
                      <strong style={{ fontSize: 'var(--fs-lg)' }}>{form.businessName || 'Your dealership'}</strong>
                      {dealer?.isVerified && <span className="badge badge-red"><Icon name="checkCircle" /> Verified</span>}
                      <span className={`badge ${TIER_BADGE[tier]}`} style={{ textTransform: 'capitalize' }}>{tier} plan</span>
                    </div>
                    <p className="text-xs muted mt-2">Square logo works best. JPEG, PNG or WebP, up to 5 MB.</p>
                  </div>
                </div>
              </section>

              <section className="card card-pad stack gap-4" aria-labelledby="biz-h">
                <h2 id="biz-h" className="card-title">Business information</h2>
                <Field label="Business name" value={form.businessName} onChange={set('businessName')} />
                <Field label="Business address" placeholder="Ring Road Central, Accra" value={form.businessAddress} onChange={set('businessAddress')} />
                <div className="grid-3">
                  <Field as="select" label="Region" value={form.region} onChange={set('region')}>
                    <option value="" disabled>Choose a region</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </Field>
                  <Field label="Phone" type="tel" autoComplete="tel" placeholder="0244 000 000" value={form.phone} onChange={set('phone')} />
                  <Field label="WhatsApp" type="tel" placeholder="Optional" value={form.whatsapp} onChange={set('whatsapp')} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="dp-desc">About your dealership</label>
                  <textarea id="dp-desc" className="textarea" rows={4} maxLength={500} placeholder="What you specialise in, how long you've been trading, services you offer…" value={form.description} onChange={set('description')} />
                  <span className="hint" style={{ alignSelf: 'flex-end' }}>{form.description.length} / 500</span>
                </div>
              </section>

              <div className="row wrap between gap-4">
                <p className="text-sm muted row gap-2"><Icon name="info" size={16} /> To change plan, contact the Carmium team.</p>
                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : 'Save profile'}
                </button>
              </div>
            </form>

            <ChangePasswordCard />

            <p className="text-sm muted center">Need to see how buyers see you? <Link to="/listings">Browse the marketplace</Link></p>
          </div>
        )}
      </div>
    </DealerLayout>
  );
}
