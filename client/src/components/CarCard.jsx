import { Link } from 'react-router-dom';
import BoostBadge from './BoostBadge';
import Icon from './Icon';
import { getPlaceholder } from '../utils/placeholder';

const PLACEHOLDER = getPlaceholder(400, 260);

export const cap = (t) => String(t || '').replace(/\b\w/g, (c) => c.toUpperCase());

export const fmtPrice = (n, currency) =>
  currency === 'USD' ? `$${Number(n).toLocaleString()}` : `GHS ${Number(n).toLocaleString()}`;

// A real link (not a div with onClick) so cards are keyboard-reachable,
// open in a new tab with ctrl/cmd-click, and are announced as links.
export default function CarCard({ listing }) {
  const img = listing.images?.[0] || PLACEHOLDER;
  const specs = [
    listing.year && { icon: 'calendar', text: listing.year },
    listing.mileage && { icon: 'gauge', text: `${Number(listing.mileage).toLocaleString()} ${listing.mileageUnit || 'km'}` },
    listing.transmission && { icon: 'cog', text: cap(listing.transmission) },
  ].filter(Boolean);

  return (
    <Link to={`/listings/${listing._id}`} className="car-card">
      <div className="car-card-media">
        <img
          src={img}
          alt={listing.title}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />
        {listing.isBoosted && <div className="car-card-flag"><BoostBadge /></div>}
        {listing.condition && <span className="car-card-cond">{cap(listing.condition)}</span>}
      </div>

      <div className="car-card-body">
        <div className="car-card-title truncate" title={listing.title}>{listing.title}</div>
        <div className="car-card-price">{fmtPrice(listing.price, listing.currency)}</div>
        {specs.length > 0 && (
          <div className="car-card-specs">
            {specs.map((s) => (
              <span key={s.icon} className="chip">
                <Icon name={s.icon} /> {s.text}
              </span>
            ))}
          </div>
        )}
        <div className="car-card-foot">
          <span className="where truncate"><Icon name="pin" /> {listing.region || 'Ghana'}</span>
          {listing.dealer && (
            <span className="row gap-1 truncate" style={{ minWidth: 0 }}>
              <span className="truncate">{listing.dealer.businessName}</span>
              {listing.dealer.isVerified && (
                <span className="verified" title="Verified dealer">
                  <Icon name="checkCircle" label="Verified dealer" />
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="car-card" aria-hidden="true">
      <div className="car-card-media skeleton" style={{ borderRadius: 0 }} />
      <div className="car-card-body">
        <div className="skeleton" style={{ height: 16, width: '72%' }} />
        <div className="skeleton" style={{ height: 22, width: '44%' }} />
        <div className="row gap-2">
          <div className="skeleton" style={{ height: 24, width: 64 }} />
          <div className="skeleton" style={{ height: 24, width: 80 }} />
        </div>
      </div>
    </div>
  );
}
