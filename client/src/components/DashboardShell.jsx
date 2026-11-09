import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon, { Brand } from './Icon';

// One sidebar shell for both dealer and admin areas. On phones the sidebar
// becomes an off-canvas drawer opened from the top bar, so navigation is
// never lost (the old dealer layout simply hid it below 768px).
export default function DashboardShell({ sections, roleLabel, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside id="dash-nav" className={`sidebar${open ? ' is-open' : ''}`} aria-label={`${roleLabel} navigation`}>
        <div className="row between">
          <Brand Link={Link} />
          <span className="badge badge-red" style={{ marginBottom: 'var(--sp-5)' }}>{roleLabel}</span>
        </div>
        <nav>
          {sections.map(({ title, items }) => (
            <div key={title || 'main'}>
              {title && <div className="side-label">{title}</div>}
              {items.map(({ to, label, icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `side-link${isActive ? ' is-active' : ''}`}>
                  <Icon name={icon} /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-user">
            <span className="avatar">{user?.name?.[0]?.toUpperCase()}</span>
            <div className="grow">
              <div className="name truncate">{user?.name}</div>
              <div className="role truncate">{user?.email}</div>
            </div>
          </div>
          <Link to="/" className="side-link"><Icon name="home" /> View marketplace</Link>
          <button type="button" className="side-link" style={{ width: '100%', background: 'none', border: 0, color: '#ff8383' }} onClick={handleLogout}>
            <Icon name="logout" /> Log out
          </button>
        </div>
      </aside>
      <div className={`scrim${open ? ' is-open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <div className="shell-main">
        <header className="shell-top">
          <button type="button" className="nav-toggle" style={{ display: 'inline-flex' }} onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} aria-controls="dash-nav">
            <Icon name="menu" />
          </button>
          <Brand Link={Link} />
          <span className="avatar">{user?.name?.[0]?.toUpperCase()}</span>
        </header>
        <main id="main" className="shell-content fade-up">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="page-header">
      <div>
        {back && <Link to={back.to} className="text-sm muted row gap-1 mb-2"><Icon name="arrowLeft" size={14} /> {back.label}</Link>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row wrap gap-2">{actions}</div>}
    </div>
  );
}

export const STATUS_BADGE = {
  new: 'badge-red', read: '', responded: 'badge-success', closed: '',
  approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-error',
  active: 'badge-success', inactive: '', suspended: 'badge-error', expired: '',
};

export function StatusBadge({ status, children }) {
  return <span className={`badge ${STATUS_BADGE[status] ?? ''}`} style={{ textTransform: 'capitalize' }}>{children || status}</span>;
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="stack gap-2" style={{ padding: 'var(--sp-4)' }} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="row gap-4">
          {Array.from({ length: cols }, (__, j) => <div key={j} className="skeleton grow" style={{ height: 18 }} />)}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon = 'list', title, children, action }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
