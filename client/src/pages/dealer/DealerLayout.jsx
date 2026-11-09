import DashboardShell from '../../components/DashboardShell';

const SECTIONS = [
  {
    title: 'Dealer',
    items: [
      { to: '/dealer/dashboard', label: 'Overview', icon: 'dashboard', end: true },
      { to: '/dealer/listings', label: 'My listings', icon: 'list', end: true },
      { to: '/dealer/listings/create', label: 'Add a listing', icon: 'plus' },
      { to: '/dealer/profile', label: 'Dealer profile', icon: 'store' },
    ],
  },
];

export default function DealerLayout({ children }) {
  return <DashboardShell sections={SECTIONS} roleLabel="Dealer">{children}</DashboardShell>;
}
