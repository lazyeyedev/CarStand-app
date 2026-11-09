import { Link } from 'react-router-dom';
import Icon, { Brand } from './Icon';

const DEFAULT_POINTS = [
  'Verified dealers in all sixteen regions',
  'Contact sellers directly by call, WhatsApp or enquiry',
  'Save time with filters for make, price, year and more',
];

// Two-column auth shell: brand panel on the left (hidden on mobile), form on
// the right. Every auth screen uses this so they read as one product.
export default function AuthLayout({ title, subtitle, children, footer, asideTitle, asidePoints = DEFAULT_POINTS, wide = false }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside" aria-hidden="true">
        <Brand Link={Link} />
        <div>
          <h2>{asideTitle || <>Ghana's marketplace for <span className="red">quality cars.</span></>}</h2>
          <ul>
            {asidePoints.map((p) => <li key={p}><Icon name="checkCircle" /> {p}</li>)}
          </ul>
        </div>
        <p className="text-xs muted">A TechSphere / Sevinity Holdings product</p>
      </aside>

      <main id="main" className="auth-main">
        <div className="auth-card fade-up" style={wide ? { maxWidth: 560 } : undefined}>
          <div className="auth-mobile-brand"><Brand Link={Link} /></div>
          <h1>{title}</h1>
          {subtitle && <p className="sub">{subtitle}</p>}
          {children}
          {footer && <div className="auth-foot">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
