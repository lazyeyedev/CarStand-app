import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import Icon, { Brand } from '../../components/Icon';
import { Field, PasswordField, SubmitButton } from '../../components/Form';

const schema = yup.object({
  email: yup.string().email('Enter a valid email address').required('Enter your email'),
  password: yup.string().required('Enter your password'),
});

export default function AdminLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async ({ email, password }) => {
    try {
      const user = await login(email, password);
      if (user.role !== 'admin') {
        await logout();
        toast.error('Access denied. Admin credentials required.');
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign in failed');
    }
  };

  return (
    <main id="main" className="page" style={{ alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-6)',
      background: 'radial-gradient(600px 300px at 50% 0%, rgba(196,30,42,.16), transparent 70%), var(--color-bg)' }}>
      <div className="card card-pad fade-up" style={{ width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
        <div className="row between mb-6">
          <Brand Link={Link} />
          <span className="badge badge-red"><Icon name="lock" /> Admin</span>
        </div>
        <h1 style={{ fontSize: 'var(--fs-2xl)' }}>Admin sign in</h1>
        <p className="text-sm muted mt-2 mb-6">Restricted area. All sign-in attempts are rate-limited.</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="stack gap-4">
          <Field label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register('email')} />
          <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
          <SubmitButton loading={isSubmitting} loadingText="Signing in…">Sign in</SubmitButton>
        </form>
      </div>
      <Link to="/" className="text-sm muted mt-6">Back to CarStand</Link>
    </main>
  );
}
