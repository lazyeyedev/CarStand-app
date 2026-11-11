import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon, { Brand } from './Icon';

export default function Navbar() {
  const { user, isDealer, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onClick = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setDropOpen(false); setMenuOpen(false); } };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  // Close menus whenever the route changes
  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const sellHref = !user ? '/register/dealer' : isDealer ? '/dealer/listings/create' : '/register/dealer';
  const navCls = ({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`;

  const accountLinks = isDealer
    ? [['/dealer/dashboard', 'Dashboard', 'dashboard'], ['/dealer/listings', 'My listings', 'list'], ['/dealer/profile', 'Dealer profile', 'store'], ['/profile/enquiries', 'Enquiries I sent', 'message']]
    : [['/profile', 'Profile', 'user'], ['/profile/enquiries', 'My enquiries', 'message'],
       ...(user?.role === 'user' ? [['/register/dealer', 'Become a dealer', 'store']] : [])];

  return (
    <header className="navbar">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="container navbar-inner">
        <Brand Link={Link} />

        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/listings" className={navCls}>Browse cars</NavLink>
          <NavLink to={sellHref} className={navCls}>Sell your car</NavLink>
          {isAdmin && <NavLink to="/admin/dashboard" className={navCls}>Admin</NavLink>}
        </nav>

        <div className="nav-actions">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Create account</Link>
            </>
          ) : (
            <div style={{ position: 'relative' }} ref={dropRef}>
              <button
                type="button"
                className="user-btn"
                onClick={() => setDropOpen((p) => !p)}
                aria-haspopup="menu"
                aria-expanded={dropOpen}
              >
                <span className="avatar">{user.name?.[0]?.toUpperCase()}</span>
                <span>{user.name?.split(' ')[0]}</span>
                <Icon name="chevDown" />
              </button>
              {dropOpen && (
                <div className="menu" role="menu">
                  {accountLinks.map(([to, label, icon]) => (
                    <Link key={to} to={to} className="menu-item" role="menuitem">
                      <Icon name={icon} /> {label}
                    </Link>
                  ))}
                  <div className="menu-sep" />
                  <button type="button" className="menu-item danger" role="menuitem" onClick={handleLogout}>
                    <Icon name="logout" /> Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="nav-toggle"
          onClick={() => setMenuOpen((p) => !p)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} />
        </button>
      </div>

      <div id="mobile-nav" className={`nav-mobile${menuOpen ? ' is-open' : ''}`}>
        <div className="container stack gap-1">
          <NavLink to="/listings" className={navCls}>Browse cars</NavLink>
          <NavLink to={sellHref} className={navCls}>Sell your car</NavLink>
          {isAdmin && <NavLink to="/admin/dashboard" className={navCls}>Admin</NavLink>}
          <div className="divider" />
          {!user ? (
            <div className="grid-2">
              <Link to="/login" className="btn btn-secondary">Log in</Link>
              <Link to="/register" className="btn btn-primary">Create account</Link>
            </div>
          ) : (
            <>
              {accountLinks.map(([to, label]) => (
                <NavLink key={to} to={to} className={navCls}>{label}</NavLink>
              ))}
              <button type="button" className="nav-link" style={{ background: 'none', border: 0, color: '#ff8383' }} onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
