import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';

// Matches the server-side policy in server/utils/validatePassword.js:
// at least 8 characters, containing at least one letter and one number.
const schema = yup.object({
  newPassword: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Za-z]/, 'Password must contain at least one letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
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
  logo:     { textAlign: 'center', marginBottom: '2rem' },
  logoText: { fontSize: '1.8rem', fontWeight: 800, letterSpacing: 1, color: '#c41e2a' },
  logoSub:  { color: '#888', fontSize: '0.8rem', marginTop: 2 },
  title:    { color: '#ececec', fontSize: '1.25rem', fontWeight: 600,
    marginBottom: '1.5rem', textAlign: 'center' },
  group:    { marginBottom: '1.2rem' },
  label:    { display: 'block', color: '#aaa', fontSize: '0.85rem',
    marginBottom: 6, fontWeight: 500 },
  inputWrap: { position: 'relative' },
  inputPassword: {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 6, padding: '0.7rem 3rem 0.7rem 1rem', color: '#ececec',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  },
  toggle: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#888', fontSize: '0.8rem',
    cursor: 'pointer', padding: 0,
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
  errorBox: {
    background: '#2a1414', border: '1px solid #4a2020', borderRadius: 8,
    padding: '1.25rem', color: '#e05252', fontSize: '0.88rem', lineHeight: 1.6,
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [status, setStatus] = useState('form'); // 'form' | 'success' | 'invalid'
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async ({ newPassword }) => {
    try {
      await axiosInstance.post('/auth/reset-password', { token, newPassword });
      setStatus('success');
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      if (err.response?.status === 400) {
        setStatus('invalid');
      } else {
        toast.error(message);
      }
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

        {!token ? (
          <>
            <div style={s.title}>Invalid reset link</div>
            <div style={s.errorBox}>
              This reset link is missing a token. Please request a new one.
            </div>
            <div style={s.links}>
              <Link to="/forgot-password" style={{ color: '#c41e2a', fontWeight: 600 }}>
                Request a new link
              </Link>
            </div>
          </>
        ) : status === 'success' ? (
          <>
            <div style={s.title}>Password reset</div>
            <div style={s.confirmBox}>
              Your password has been updated successfully. You can now sign in with your new password.
            </div>
            <button type="button" style={s.btn} onClick={() => navigate('/login')}>
              Go to Sign In
            </button>
          </>
        ) : status === 'invalid' ? (
          <>
            <div style={s.title}>Link expired or invalid</div>
            <div style={s.errorBox}>
              This reset link is invalid or has expired. Reset links are valid for 1 hour.
            </div>
            <div style={s.links}>
              <Link to="/forgot-password" style={{ color: '#c41e2a', fontWeight: 600 }}>
                Request a new link
              </Link>
            </div>
          </>
        ) : (
          <>
            <div style={s.title}>Set a new password</div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={s.group}>
                <label style={s.label}>New Password</label>
                <div style={s.inputWrap}>
                  <input {...register('newPassword')} type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters, 1 letter & 1 number" style={s.inputPassword} />
                  <button type="button" style={s.toggle} onClick={() => setShowPw(p => !p)}>
                    {showPw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {errors.newPassword && <div style={s.error}>{errors.newPassword.message}</div>}
              </div>

              <div style={s.group}>
                <label style={s.label}>Confirm New Password</label>
                <div style={s.inputWrap}>
                  <input {...register('confirmPassword')} type={showCpw ? 'text' : 'password'}
                    placeholder="Repeat password" style={s.inputPassword} />
                  <button type="button" style={s.toggle} onClick={() => setShowCpw(p => !p)}>
                    {showCpw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {errors.confirmPassword && <div style={s.error}>{errors.confirmPassword.message}</div>}
              </div>

              <button type="submit"
                style={{ ...s.btn, ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                disabled={isSubmitting}>
                {isSubmitting ? <><Spinner /> Resetting…</> : 'Reset Password'}
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
