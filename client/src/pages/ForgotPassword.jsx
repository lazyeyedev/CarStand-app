import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import { Field, SubmitButton } from '../components/Form';

const schema = yup.object({
  email: yup.string().email('Enter a valid email address').required('Enter your email'),
});

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async ({ email }) => {
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      setSentTo(email);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Try again.');
    }
  };

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" footer={<Link to="/login"><Icon name="arrowLeft" size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Back to sign in</Link>}>
        <div className="alert alert-success mt-4">
          <Icon name="mail" />
          <div>
            If an account exists for <strong>{sentTo}</strong>, we've sent a link to reset your password. The link expires in 1 hour.
          </div>
        </div>
        <p className="text-sm muted mt-4">Didn't get it? Check your spam folder, or <button type="button" className="link-btn" onClick={() => setSentTo('')}>try a different email</button>.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a reset link."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stack gap-4">
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <SubmitButton loading={isSubmitting} loadingText="Sending…">Send reset link</SubmitButton>
      </form>
    </AuthLayout>
  );
}
