import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Spinner = () => (
  <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }} role="status">
    <span className="spinner" style={{ width: 32, height: 32, color: 'var(--red-text)' }} />
    <span className="sr-only">Loading</span>
  </div>
);

// Public-facing protected route — redirects to /login
const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    toast.error('Access denied');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Admin-only protected route — redirects to /admin/login
export const AdminProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
