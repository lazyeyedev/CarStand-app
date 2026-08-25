import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const schema = yup.object({
  name:            yup.string().required('Full name is required'),
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
});

const s = {
  page: {
    minHeight: '100vh', background: '#0d0d0d', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
  },
  card: {
    width: '100%', maxWidth: 480, background: '#141414',
    border: '1px solid #2a2a2a', borderRadius: 12,
    padding: '2.5rem 2rem', boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  },
  logo: { textAlign: 'center', marginBottom: '2rem' },
  logoText: { fontSize: '1.8rem', fontWeight: 800, letterSpacing: 1, color: '#c41e2a' },
  logoSub:  { color: '#888', fontSize: '0.8rem', marginTop: 2 },
  title:    { color: '#ececec', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' },
  group:    { marginBottom: '1.2rem' },
  label:    { display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: 6, fontWeight: 500 },
  inputWrap: { position: 'relative' },
  input: {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 6, padding: '0.7rem 1rem', color: '#ececec',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  },
  inputPw: {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 6, padding: '0.7rem 3rem 0.7rem 1rem', color: '#ececec',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  },
  toggle: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', cursor: 'pointer', padding: 0,
  },
  error: { color: '#e05252', fontSize: '0.78rem', marginTop: 4 },
  btn: {
    width: '100%', background: '#c41e2a', color: '#0d0d0d', border: 'none',
    borderRadius: 6, padding: '0.8rem', fontWeight: 700, fontSize: '1rem',
    marginTop: '0.5rem', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  links: { textAlign: 'center', marginTop: '1.5rem', color: '#888', fontSize: '0.85rem' },
};

const focusStyle = `input:focus,select:focus{border-color:#c41e2a!important;box-shadow:0 0 0 2px rgba(196,30,42,0.15)}`;
const spinStyle  = `@keyframes spin{to{transform:rotate(360deg)}}`;

const Spinner = () => (
  <span style={{ width:16, height:16, border:'2px solid #0d0d0d44', borderTop:'2px solid #0d0d0d',
    borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
);

export default function Register() {
  const [showPw, setShowPw]     = useState(false);
  const [showCpw, setShowCpw]   = useState(false);
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await registerUser({ name: data.name, email: data.email, phone: data.phone, password: data.password });
      toast.success('Welcome to CarStand!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={s.page}>
      <style>{focusStyle}{spinStyle}</style>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoText}>CarStand</div>
          <div style={s.logoSub}>Ghana's Premium Car Marketplace</div>
        </div>
        <div style={s.title}>Create Account</div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={s.group}>
            <label style={s.label}>Full Name</label>
            <input {...register('name')} type="text" placeholder="Kofi Mensah" style={s.input} />
            {errors.name && <div style={s.error}>{errors.name.message}</div>}
          </div>

          <div style={s.group}>
            <label style={s.label}>Email Address</label>
            <input {...register('email')} type="email" placeholder="you@example.com" style={s.input} />
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

          <button type="submit" style={{ ...s.btn, ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
            disabled={isSubmitting}>
            {isSubmitting ? <><Spinner /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <div style={s.links}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#c41e2a', fontWeight: 600 }}>Sign in</Link>
          {' · '}
          <Link to="/register/dealer" style={{ color: '#c41e2a', fontWeight: 600 }}>Register as Dealer</Link>
        </div>
      </div>
    </div>
  );
}
