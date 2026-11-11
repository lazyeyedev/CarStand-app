import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Field, PasswordField, SubmitButton, PASSWORD_HINT } from '../components/Form';

const schema = yup.object({
  name: yup.string().required('Enter your full name'),
  email: yup.string().email('Enter a valid email address').required('Enter your email'),
  phone: yup.string().required('Enter your phone number'),
  password: yup.string()
    .min(8, 'Use at least 8 characters')
    .matches(/[A-Za-z]/, 'Include at least one letter')
    .matches(/[0-9]/, 'Include at least one number')
    .required('Create a password'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Confirm your password'),
});

export default function Register() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser({ name: data.name, email: data.email, phone: data.phone, password: data.password });
      toast.success('Welcome to Carmium');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Your account could not be created. Try again.');
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Keep track of your enquiries and the cars you're interested in."
      footer={<>Already have an account? <Link to="/login">Sign in</Link><br />Selling cars? <Link to="/register/dealer">Register as a dealer</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stack gap-4">
        <Field label="Full name" autoComplete="name" placeholder="Kofi Mensah" error={errors.name?.message} {...register('name')} />
        <div className="grid-2">
          <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Field label="Phone" type="tel" autoComplete="tel" placeholder="0244 000 000" error={errors.phone?.message} {...register('phone')} />
        </div>
        <PasswordField label="Password" autoComplete="new-password" hint={PASSWORD_HINT} error={errors.password?.message} {...register('password')} />
        <PasswordField label="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <SubmitButton loading={isSubmitting} loadingText="Creating account…">Create account</SubmitButton>
      </form>
    </AuthLayout>
  );
}
