import DashboardShell from '../../components/DashboardShell';

const SECTIONS = [
  {
    title: 'Overview',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', end: true }],
  },
  {
    title: 'Manage',
    items: [
      { to: '/admin/dealers', label: 'Dealers', icon: 'store' },
      { to: '/admin/listings', label: 'Listings', icon: 'car' },
      { to: '/admin/users', label: 'Users', icon: 'users' },
      { to: '/admin/boosts', label: 'Boosts', icon: 'zap' },
    ],
  },
];

export default function AdminLayout({ children }) {
  return <DashboardShell sections={SECTIONS} roleLabel="Admin">{children}</DashboardShell>;
}
