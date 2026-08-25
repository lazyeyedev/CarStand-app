import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Upper East', 'Upper West', 'Volta', 'Bono',
  'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North',
];

const schema = yup.object({
  name:            yup.string().required('Owner name is required'),
  email:           yup.string().email('Enter a valid email').required('Email is required'),
  phone:           yup.string().required('Phone number is required'),
  password:        yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Za-z]/, 'Password must contain at least one letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
  businessName:    yup.string().required('Business name is required'),
  businessAddress: yup.string().required('Business address is required'),
  region:          yup.string().required('Region is required'),
  whatsapp:        yup.string(),
});

const base = {
  width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
  borderRadius: 6, padding: '0.7rem 1rem', color: '#ececec',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
};

const s = {
  page: {
    minHeight: '100vh', background: '#0d0d0d', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem',
  },
  card: {
    width: '100%', maxWidth: 480, background: '#141414',
    border: '1px solid #2a2a2a', borderRadius: 12,
    padding: '2.5rem 2rem', boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  },
  logo:     { textAlign: 'center', marginBottom: '2rem' },
  logoText: { fontSize: '1.8rem', fontWeight: 800, letterSpacing: 1, color: '#c41e2a' },
  logoSub:  { color: '#888', fontSize: '0.8rem', marginTop: 2 },
  title:    { color: '#ececec', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.4rem', textAlign: 'center' },
  subtitle: { color: '#888', fontSize: '0.82rem', textAlign: 'center', marginBottom: '1.8rem' },
  divLabel: { color: '#c41e2a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: '1rem', marginTop: '1.4rem',
    borderBottom: '1px solid #2a2a2a', paddingBottom: '0.4rem' },
  group:  { marginBottom: '1.1rem' },
  label:  { display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: 6, fontWeight: 500 },
  inputWrap: { position: 'relative' },
  input:  base,
  inputPw: { ...base, padding: '0.7rem 3rem 0.7rem 1rem' },
  select: { ...base, cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23888' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' },
  toggle: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', cursor: 'pointer', padding: 0,
  },
  error: { color: '#e05252', fontSize: '0.78rem', marginTop: 4 },
  btn: {
    width: '100%', background: '#c41e2a', color: '#0d0d0d', border: 'none',
    borderRadius: 6, padding: '0.85rem', fontWeight: 700, fontSize: '1rem',
    marginTop: '0.75rem', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  links: { textAlign: 'center', marginTop: '1.5rem', color: '#888', fontSize: '0.85rem' },
};

const focusStyle = `
  input:focus, select:focus, textarea:focus {
    border-color: #c41e2a !important;
    box-shadow: 0 0 0 2px rgba(196,30,42,0.15);
  }
  select option { background: #1a1a1a; color: #ececec; }
`;

const Spinner = () => (
  <span style={{ width:16, height:16, border:'2px solid #0d0d0d44', borderTop:'2px solid #0d0d0d',
    borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
);

export default function RegisterDealer() {
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const { registerDealer } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await registerDealer({
        name: data.name, email: data.email, phone: data.phone, password: data.password,
        businessName: data.businessName, businessAddress: data.businessAddress,
        region: data.region, whatsapp: data.whatsapp || '',
      });
      toast.success('Account created — pending admin approval');
      navigate('/dealer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={s.page}>
      <style>{focusStyle}{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoText}>CarStand</div>
          <div style={s.logoSub}>Ghana's Premium Car Marketplace</div>
        </div>
        <div style={s.title}>Dealer Registration</div>
        <div style={s.subtitle}>Create a dealer account to list your vehicles</div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Account Details */}
          <div style={s.divLabel}>Account Details</div>

          <div style={s.group}>
            <label style={s.label}>Owner / Contact Name</label>
            <input {...register('name')} type="text" placeholder="Ama Owusu" style={s.input} />
            {errors.name && <div style={s.error}>{errors.name.message}</div>}
          </div>

          <div style={s.group}>
            <label style={s.label}>Email Address</label>
            <input {...register('email')} type="email" placeholder="dealer@example.com" style={s.input} />
            {errors.email && <div style={s.error}>{errors.email.message}</div>}
          </div>

          <div style={s.group}>
            <label style={s.label}>Phone Number</label>
            <input {...register('phone')} type="tel" placeholder="0244000000" style={s.input} />
            {errors.phone && <div style={s.error}>{errors.phone.message}</div>}
          </div>

          <div style={s.group}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <input {...register('password')} type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters, 1 letter & 1 number" style={s.inputPw} />
              <button type="button" style={s.toggle} onClick={() => setShowPw(p => !p)}>
                {showPw ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            {errors.password && <div style={s.error}>{errors.password.message}</div>}
          </div>

          <div style={s.group}>
            <label style={s.label}>Confirm Password</label>
            <div style={s.inputWrap}>
              <input {...register('confirmPassword')} type={showCpw ? 'text' : 'password'}
                placeholder="Repeat password" style={s.inputPw} />
              <button type="button" style={s.toggle} onClick={() => setShowCpw(p => !p)}>
                {showCpw ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            {errors.confirmPassword && <div style={s.error}>{errors.confirmPassword.message}</div>}
          </div>

          {/* Business Details */}
          <div style={s.divLabel}>Business Details</div>

          <div style={s.group}>
            <label style={s.label}>Business / Dealership Name</label>
            <input {...register('businessName')} type="text" placeholder="Accra Auto Hub" style={s.input} />
            {errors.businessName && <div style={s.error}>{errors.businessName.message}</div>}
          </div>

          <div style={s.group}>
            <label style={s.label}>Business Address</label>
            <input {...register('businessAddress')} type="text"
              placeholder="Ring Road Central, Accra" style={s.input} />
            {errors.businessAddress && <div style={s.error}>{errors.businessAddress.message}</div>}
          </div>

          <div style={s.group}>
            <label style={s.label}>Region</label>
            <select {...register('region')} style={s.select} defaultValue="">
              <option value="" disabled>Select region</option>
              {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.region && <div style={s.error}>{errors.region.message}</div>}
          </div>

          <div style={s.group}>
            <label style={s.label}>WhatsApp Number <span style={{ color:'#555' }}>(optional)</span></label>
            <input {...register('whatsapp')} type="tel" placeholder="0244000000" style={s.input} />
          </div>

          <button type="submit"
            style={{ ...s.btn, ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
            disabled={isSubmitting}>
            {isSubmitting ? <><Spinner /> Creating account…</> : 'Create Dealer Account'}
          </button>
        </form>

        <div style={s.links}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#c41e2a', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
