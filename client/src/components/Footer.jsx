import { Link } from 'react-router-dom';
import { InstallAppButton } from './AppStatus';
import Icon, { Brand } from './Icon';

// Contact details are deliberately limited to what's true today: the
// platform has no owned domain or public phone line yet, so no address is
// shown that would send buyers' mail or calls to a stranger.
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand Link={Link} />
            <p className="text-sm mt-4" style={{ maxWidth: '40ch' }}>
              Ghana's marketplace for quality vehicles from verified dealers, across all sixteen regions.
            </p>
          </div>

          <nav aria-label="Footer">
            <h4>Marketplace</h4>
            <Link to="/listings" className="f-link">Browse cars</Link>
            <Link to="/register/dealer" className="f-link">Sell as a dealer</Link>
            <Link to="/login" className="f-link">Log in</Link>
            <Link to="/register" className="f-link">Create account</Link>
          </nav>

          <div>
            <h4>Get in touch</h4>
            <div className="footer-line"><Icon name="pin" /> Accra, Ghana</div>
            <div className="footer-line"><Icon name="shield" /> Every dealer is reviewed before listing</div>
          </div>
        </div>

        <div className="footer-base">
          <span>© {year} Carmium. All rights reserved.</span>
          <InstallAppButton />
          <span>A TechSphere / Sevinity Holdings product</span>
        </div>
      </div>
    </footer>
  );
}
