import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
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
  logo:     { textAlign: 'center', marginBottom: '2rem' },
  logoText: { fontSize: '1.8rem', fontWeight: 800, letterSpacing: 1, color: '#c41e2a' },
  logoSub:  { color: '#888', fontSize: '0.8rem', marginTop: 2 },
  title:    { color: '#ececec', fontSize: '1.25rem', fontWeight: 600,
    marginBottom: '0.75rem', textAlign: 'center' },
  subtitle: { color: '#888', fontSize: '0.85rem', textAlign: 'center',
    marginBottom: '1.5rem', lineHeight: 1.5 },
  group:    { marginBottom: '1.2rem' },
  label:    { display: 'block', color: '#aaa', fontSize: '0.85rem',
    marginBottom: 6, fontWeight: 500 },
  input: {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 6, padding: '0.7rem 1rem', color: '#ececec',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  },
  error:  { color: '#e05252', fontSize: '0.78rem', marginTop: 4 },
  btn: {
    width: '100%', background: '#c41e2a', color: '#0d0d0d', border: 'none',
    borderRadius: 6, padding: '0.8rem', fontWeight: 700, fontSize: '1rem',
    marginTop: '0.5rem', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  links:   { textAlign: 'center', marginTop: '1.5rem', color: '#888', fontSize: '0.85rem' },
  confirmBox: {
    background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
    padding: '1.25rem', color: '#ccc', fontSize: '0.88rem', lineHeight: 1.6,
    textAlign: 'center', marginBottom: '1.5rem',
  },
};

const focusStyle = `
  input:focus { border-color: #c41e2a !important; box-shadow: 0 0 0 2px rgba(196,30,42,0.15); }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const Spinner = () => (
  <span style={{ width: 16, height: 16, border: '2px solid #0d0d0d44',
    borderTop: '2px solid #0d0d0d', borderRadius: '50%',
    display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
);

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async ({ email }) => {
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div style={s.page}>
      <style>{focusStyle}</style>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoText}>CarStand</div>
          <div style={s.logoSub}>Ghana's Premium Car Marketplace</div>
        </div>

        {sent ? (
          <>
            <div style={s.title}>Check your email</div>
            <div style={s.confirmBox}>
              If an account exists for that email address, we've sent a link to reset your
              password. The link expires in 1 hour.
            </div>
            <div style={s.links}>
              <Link to="/login" style={{ color: '#c41e2a', fontWeight: 600 }}>Back to sign in</Link>
            </div>
          </>
        ) : (
          <>
            <div style={s.title}>Reset your password</div>
            <div style={s.subtitle}>
              Enter the email address on your account and we'll send you a link to reset your password.
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={s.group}>
                <label style={s.label}>Email Address</label>
                <input {...register('email')} type="email" placeholder="you@example.com"
                  style={s.input} />
                {errors.email && <div style={s.error}>{errors.email.message}</div>}
              </div>

              <button type="submit"
                style={{ ...s.btn, ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                disabled={isSubmitting}>
                {isSubmitting ? <><Spinner /> Sending…</> : 'Send Reset Link'}
              </button>
            </form>

            <div style={s.links}>
              <Link to="/login" style={{ color: '#c41e2a', fontWeight: 600 }}>Back to sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
