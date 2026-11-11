import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Field, PasswordField, SubmitButton } from '../components/Form';

const schema = yup.object({
  email: yup.string().email('Enter a valid email address').required('Enter your email'),
  password: yup.string().required('Enter your password'),
});

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async ({ email, password }) => {
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        await logout();
        toast.error('Admins sign in at /admin/login');
        return;
      }
      navigate(user.role === 'dealer' ? '/dealer/dashboard' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign in failed. Check your email and password.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your enquiries and listings."
      footer={<>New to Carmium? <Link to="/register">Create an account</Link> or <Link to="/register/dealer">join as a dealer</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stack gap-4">
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <div className="stack gap-2">
          <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
          <Link to="/forgot-password" className="text-sm" style={{ alignSelf: 'flex-end' }}>Forgot password?</Link>
        </div>
        <SubmitButton loading={isSubmitting} loadingText="Signing in…">Sign in</SubmitButton>
      </form>
    </AuthLayout>
  );
}
