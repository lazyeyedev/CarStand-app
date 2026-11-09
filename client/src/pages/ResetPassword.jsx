import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import { PasswordField, SubmitButton, PASSWORD_HINT } from '../components/Form';

// Matches the server policy in server/utils/validatePassword.js
const schema = yup.object({
  newPassword: yup.string()
    .min(8, 'Use at least 8 characters')
    .matches(/[A-Za-z]/, 'Include at least one letter')
    .matches(/[0-9]/, 'Include at least one number')
    .required('Create a new password'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Confirm your new password'),
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('form'); // form | success | invalid
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async ({ newPassword }) => {
    try {
      await axiosInstance.post('/auth/reset-password', { token, newPassword });
      setStatus('success');
    } catch (err) {
      if (err.response?.status === 400) setStatus('invalid');
      else toast.error(err.response?.data?.message || 'Something went wrong. Try again.');
    }
  };

  if (!token || status === 'invalid') {
    return (
      <AuthLayout title="This link has expired" footer={<Link to="/login">Back to sign in</Link>}>
        <div className="alert alert-error mt-4">
          <Icon name="alert" />
          <div>{!token ? 'This reset link is incomplete.' : 'This reset link is invalid, expired, or has already been used.'} Reset links work once and expire after 1 hour.</div>
        </div>
        <Link to="/forgot-password" className="btn btn-primary btn-block btn-lg mt-6">Request a new link</Link>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Password updated">
        <div className="alert alert-success mt-4">
          <Icon name="checkCircle" />
          <div>Your password has been changed. Sign in with your new password.</div>
        </div>
        <Link to="/login" className="btn btn-primary btn-block btn-lg mt-6">Go to sign in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a password you haven't used here before." footer={<Link to="/login">Back to sign in</Link>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stack gap-4">
        <PasswordField label="New password" autoComplete="new-password" hint={PASSWORD_HINT} error={errors.newPassword?.message} {...register('newPassword')} />
        <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <SubmitButton loading={isSubmitting} loadingText="Saving…">Update password</SubmitButton>
      </form>
    </AuthLayout>
  );
}
