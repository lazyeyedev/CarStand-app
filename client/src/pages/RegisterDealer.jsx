import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Field, PasswordField, SubmitButton, PASSWORD_HINT } from '../components/Form';
import { REGIONS } from '../utils/options';

const schema = yup.object({
  name: yup.string().required("Enter the owner's name"),
  email: yup.string().email('Enter a valid email address').required('Enter an email'),
  phone: yup.string().required('Enter a phone number'),
  password: yup.string()
    .min(8, 'Use at least 8 characters')
    .matches(/[A-Za-z]/, 'Include at least one letter')
    .matches(/[0-9]/, 'Include at least one number')
    .required('Create a password'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Confirm your password'),
  businessName: yup.string().required('Enter your business name'),
  businessAddress: yup.string().required('Enter your business address'),
  region: yup.string().required('Choose a region'),
  whatsapp: yup.string(),
});

const STEP_TITLE = { fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--red-text)' };

// Shown instead of the full form when a buyer is already signed in: they keep
// their account and only add the dealership details.
const upgradeSchema = yup.object({
  phone: yup.string().required('Enter a phone number'),
  businessName: yup.string().required('Enter your business name'),
  businessAddress: yup.string().required('Enter your business address'),
  region: yup.string().required('Choose a region'),
  whatsapp: yup.string(),
});

const ASIDE_POINTS = [
  'List your stock with up to 10 photos per car',
  'Enquiries go straight to your email',
  'Feature your best cars at the top of search',
];

function UpgradeToDealer({ user }) {
  const { upgradeToDealer } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(upgradeSchema),
    defaultValues: { phone: user.phone || '' },
  });

  const onSubmit = async (data) => {
    try {
      await upgradeToDealer({
        phone: data.phone, businessName: data.businessName, businessAddress: data.businessAddress,
        region: data.region, whatsapp: data.whatsapp || '',
      });
      toast.success('Your account is now a dealer account. Your dealership is pending approval.');
      navigate('/dealer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Your account could not be upgraded. Try again.');
    }
  };

  return (
    <AuthLayout
      wide
      title="Become a dealer"
      subtitle={<>You're signed in as <strong>{user.email}</strong>. Add your dealership details and this account becomes a dealer account — same login, and your enquiries stay with you.</>}
      asideTitle={<>Sell to buyers <span className="red">across Ghana.</span></>}
      asidePoints={ASIDE_POINTS}
      footer={<>Changed your mind? <Link to="/profile">Back to your profile</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stack gap-6">
        <fieldset className="stack gap-4" style={{ border: 0 }}>
          <legend style={STEP_TITLE} className="mb-4">Your dealership</legend>
          <Field label="Business name" autoComplete="organization" placeholder="Accra Auto Hub" error={errors.businessName?.message} {...register('businessName')} />
          <Field label="Business address" autoComplete="street-address" placeholder="Spintex Road, Accra" error={errors.businessAddress?.message} {...register('businessAddress')} />
          <div className="grid-2">
            <Field as="select" label="Region" defaultValue="" error={errors.region?.message} {...register('region')}>
              <option value="" disabled>Choose a region</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Field>
            <Field label="Business phone" type="tel" autoComplete="tel" placeholder="0244 000 000" error={errors.phone?.message} {...register('phone')} />
          </div>
          <Field label="WhatsApp (optional)" type="tel" placeholder="0244 000 000" hint="Buyers can message you from your listings." {...register('whatsapp')} />
        </fieldset>
        <p className="text-sm muted">Every dealership is reviewed before its listings go live. Approval usually takes one working day.</p>
        <SubmitButton loading={isSubmitting} loadingText="Upgrading…">Become a dealer</SubmitButton>
      </form>
    </AuthLayout>
  );
}

export default function RegisterDealer() {
  const { user, loading } = useAuth();

  // Wait for the session check so a signed-in buyer never sees the wrong form flash.
  if (loading) return null;
  if (user?.role === 'dealer') return <Navigate to="/dealer/dashboard" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'user') return <UpgradeToDealer user={user} />;
  return <NewDealerForm />;
}

function NewDealerForm() {
  const { registerDealer } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerDealer({
        name: data.name, email: data.email, phone: data.phone, password: data.password,
        businessName: data.businessName, businessAddress: data.businessAddress,
        region: data.region, whatsapp: data.whatsapp || '',
      });
      toast.success('Account created. Your dealership is pending approval.');
      navigate('/dealer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  return (
    <AuthLayout
      wide
      title="Register your dealership"
      subtitle="Every dealership is reviewed before its listings go live. Approval usually takes one working day."
      asideTitle={<>Sell to buyers <span className="red">across Ghana.</span></>}
      asidePoints={ASIDE_POINTS}
      footer={<>Already have an account? <Link to="/login">Sign in</Link> — buyer accounts can be upgraded to dealer after signing in.</>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stack gap-6">
        <fieldset className="stack gap-4" style={{ border: 0 }}>
          <legend style={STEP_TITLE} className="mb-4">1 · Your details</legend>
          <Field label="Owner's full name" autoComplete="name" placeholder="Ama Owusu" error={errors.name?.message} {...register('name')} />
          <div className="grid-2">
            <Field label="Email" type="email" autoComplete="email" placeholder="dealer@example.com" error={errors.email?.message} {...register('email')} />
            <Field label="Phone" type="tel" autoComplete="tel" placeholder="0244 000 000" error={errors.phone?.message} {...register('phone')} />
          </div>
          <div className="grid-2">
            <PasswordField label="Password" autoComplete="new-password" hint={PASSWORD_HINT} error={errors.password?.message} {...register('password')} />
            <PasswordField label="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          </div>
        </fieldset>

        <fieldset className="stack gap-4" style={{ border: 0 }}>
          <legend style={STEP_TITLE} className="mb-4">2 · Your dealership</legend>
          <Field label="Business name" autoComplete="organization" placeholder="Accra Auto Hub" error={errors.businessName?.message} {...register('businessName')} />
          <Field label="Business address" autoComplete="street-address" placeholder="Spintex Road, Accra" error={errors.businessAddress?.message} {...register('businessAddress')} />
          <div className="grid-2">
            <Field as="select" label="Region" defaultValue="" error={errors.region?.message} {...register('region')}>
              <option value="" disabled>Choose a region</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Field>
            <Field label="WhatsApp (optional)" type="tel" placeholder="0244 000 000" hint="Buyers can message you from your listings." {...register('whatsapp')} />
          </div>
        </fieldset>

        <SubmitButton loading={isSubmitting} loadingText="Creating account…">Create dealer account</SubmitButton>
      </form>
    </AuthLayout>
  );
}
