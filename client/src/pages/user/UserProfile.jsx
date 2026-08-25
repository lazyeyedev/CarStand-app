import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CarCard from '../../components/CarCard';
import axiosInstance from '../../api/axiosInstance';

const inp  = { width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:6, padding:'0.65rem 0.9rem', color:'#ececec', fontSize:'0.88rem', outline:'none', boxSizing:'border-box' };
const lbl  = { display:'block', color:'#888', fontSize:'0.78rem', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 };
const sect = { background:'#141414', border:'1px solid #2a2a2a', borderRadius:10, padding:'1.5rem', marginBottom:'1.5rem' };
const sectH = { color:'#ececec', fontSize:'1rem', fontWeight:700, marginBottom:'1.25rem', paddingBottom:'0.75rem', borderBottom:'1px solid #1e1e1e' };

export default function UserProfile() {
  
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const avatarRef = useRef(null);

  const [form, setForm] = useState({ name:'', phone:'' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [showPw, setShowPw] = useState({ current:false, new:false, confirm:false });

  useEffect(() => {
    axiosInstance.get('/auth/me').then(r => {
      setProfile(r.data.user);
      setForm({ name: r.data.user.name || '', phone: r.data.user.phone || '' });
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const handleAvatarPick = (file) => {
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = e => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      if (form.name)  fd.append('name', form.name);
      if (form.phone) fd.append('phone', form.phone);
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await axiosInstance.put('/users/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(data);
      setAvatarFile(null);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters'); return;
    }
    if (!/[A-Za-z]/.test(pwForm.newPassword) || !/[0-9]/.test(pwForm.newPassword)) {
      toast.error('New password must contain at least one letter and one number'); return;
    }
    setChangingPw(true);
    try {
      await axiosInstance.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setChangingPw(false); }
  };

  const PwField = ({ field, label: fieldLabel, value }) => (
    <div>
      <label style={lbl}>{fieldLabel}</label>
      <div style={{ position:'relative' }}>
        <input type={showPw[field] ? 'text' : 'password'} value={value}
          onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
          style={{ ...inp, paddingRight:'3.5rem' }} />
        <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', color:'#666', fontSize:'0.75rem', cursor:'pointer' }}>
          {showPw[field] ? 'HIDE' : 'SHOW'}
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0d0d0d' }}>
      <Navbar />
      <div style={{ textAlign:'center', padding:'4rem', color:'#444' }}>Loading…</div>
    </div>
  );

  const displayAvatar = avatarPreview || profile?.avatar;
  const initials = profile?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d0d', display:'flex', flexDirection:'column' }}>
      <style>{`input:focus,select:focus,textarea:focus{border-color:#c41e2a!important;box-shadow:0 0 0 2px rgba(196,30,42,0.12)}`}</style>
      <Navbar />
      <main style={{ flex:1, maxWidth:860, margin:'0 auto', width:'100%', padding:'2rem 1.5rem' }}>
        <h1 style={{ color:'#ececec', fontSize:'1.4rem', fontWeight:700, marginBottom:'1.5rem' }}>My Profile</h1>

        {/* Profile form */}
        <div style={sect}>
          <div style={sectH}>Account Details</div>
          <form onSubmit={handleSaveProfile} noValidate>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'1.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
              {/* Avatar */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                <div onClick={() => avatarRef.current?.click()}
                  style={{ width:90, height:90, borderRadius:'50%', overflow:'hidden', cursor:'pointer',
                    background:'#1e1e1e', border:'2px solid #2a2a2a', flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  {displayAvatar
                    ? <img src={displayAvatar} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ color:'#c41e2a', fontWeight:800, fontSize:'1.4rem' }}>{initials}</span>}
                  <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    opacity:0, transition:'opacity 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.opacity=1}
                    onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                    <span style={{ color:'#fff', fontSize:'0.7rem', fontWeight:600 }}>CHANGE</span>
                  </div>
                </div>
                <button type="button" onClick={() => avatarRef.current?.click()}
                  style={{ background:'none', border:'none', color:'#c41e2a', fontSize:'0.78rem',
                    cursor:'pointer', padding:0 }}>
                  Upload photo
                </button>
                <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
                  onChange={e => handleAvatarPick(e.target.files[0])} />
              </div>

              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'1rem', minWidth:200 }}>
                <div>
                  <label style={lbl}>Full Name</label>
                  <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Email Address</label>
                  <input value={profile?.email || ''} disabled
                    style={{ ...inp, opacity:0.45, cursor:'not-allowed' }} />
                </div>
                <div>
                  <label style={lbl}>Phone Number</label>
                  <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}
                    type="tel" placeholder="0244000000" style={inp} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving}
              style={{ background:'#c41e2a', color:'#0d0d0d', border:'none', borderRadius:6,
                padding:'0.65rem 1.5rem', fontWeight:700, fontSize:'0.9rem',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div style={sect}>
          <div style={sectH}>Change Password</div>
          <form onSubmit={handleChangePassword} noValidate>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem', maxWidth:420 }}>
              <PwField field="current" label="Current Password" value={pwForm.currentPassword} />
              <PwField field="new"     label="New Password"     value={pwForm.newPassword} />
              <PwField field="confirm" label="Confirm New Password" value={pwForm.confirmPassword} />
            </div>
            <button type="submit" disabled={changingPw}
              style={{ marginTop:'1.25rem', background:'#1e1e1e', color:'#ececec',
                border:'1px solid #2a2a2a', borderRadius:6, padding:'0.65rem 1.5rem',
                fontWeight:600, fontSize:'0.9rem',
                cursor: changingPw ? 'not-allowed' : 'pointer', opacity: changingPw ? 0.6 : 1 }}>
              {changingPw ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Saved listings */}
        <div style={sect}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            paddingBottom:'0.75rem', borderBottom:'1px solid #1e1e1e', marginBottom:'1.25rem' }}>
            <div style={{ color:'#ececec', fontSize:'1rem', fontWeight:700 }}>Saved Listings</div>
            <Link to="/listings" style={{ color:'#c41e2a', fontSize:'0.82rem' }}>Browse more →</Link>
          </div>
          {profile?.savedListings?.length > 0 ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
              {profile.savedListings.map(l => <CarCard key={l._id || l} listing={l} />)}
            </div>
          ) : (
            <div style={{ color:'#555', textAlign:'center', padding:'2rem 0', fontSize:'0.88rem' }}>
              No saved listings yet.{' '}
              <Link to="/listings" style={{ color:'#c41e2a' }}>Browse cars →</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
