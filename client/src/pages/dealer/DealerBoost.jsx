import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DealerLayout from './DealerLayout';
import Icon from '../../components/Icon';
import { PageHeader } from '../../components/DashboardShell';
import { fmtPrice } from '../../components/CarCard';
import axiosInstance from '../../api/axiosInstance';
import { getPlaceholder } from '../../utils/placeholder';

const PLACEHOLDER = getPlaceholder(120, 84);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const BENEFITS = [
  'Shown above standard listings in search results',
  'Featured badge on the listing and its card',
  'Included in the Featured row on the home page',
];

export default function DealerBoost() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const listingId = searchParams.get('listingId');

  const [listing, setListing] = useState(null);
  const [prices, setPrices] = useState(null); // { 7: 50, 14: 90, 30: 150 }
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!listingId) { navigate('/dealer/listings', { replace: true }); return; }
    Promise.all([
      axiosInstance.get(`/listings/dealer/mine/${listingId}`),
      axiosInstance.get('/boosts/pricing'),
    ]).then(([l, p]) => {
      setListing(l.data);
      setPrices(p.data.featured || {});
    }).catch(() => {
      toast.error('That listing could not be loaded');
      navigate('/dealer/listings', { replace: true });
    }).finally(() => setLoading(false));
  }, [listingId, navigate]);

  const durations = prices ? Object.keys(prices).map(Number).sort((a, b) => a - b) : [];
  const price = prices?.[duration] ?? 0;
  const isLive = listing?.isApproved && listing?.isActive;
  const featuredUntil = listing?.isBoosted && listing?.boostExpiry && new Date(listing.boostExpiry) > new Date()
    ? listing.boostExpiry : null;

  const pay = async () => {
    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post('/boosts/initialize', { listingId, boostType: 'featured', durationDays: duration });
      window.location.href = data.authorization_url; // Paystack checkout
    } catch (err) {
      toast.error(err.response?.data?.message || 'The payment could not be started. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <DealerLayout>
      <div style={{ maxWidth: 720 }}>
        <PageHeader
          back={{ to: '/dealer/listings', label: 'My listings' }}
          title="Feature this listing"
          subtitle="Put this car in front of more buyers for a set number of days."
        />

        {loading ? (
          <div className="stack gap-4">{[110, 180, 120].map((h) => <div key={h} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-md)' }} />)}</div>
        ) : (
          <div className="stack gap-6">
            <section className="card card-pad row gap-4" aria-label="Listing">
              <img src={listing.images?.[0] || PLACEHOLDER} alt="" width="120" height="84"
                style={{ width: 120, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)', flexShrink: 0 }}
                onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
              <div style={{ minWidth: 0 }}>
                <div className="truncate" style={{ fontWeight: 700, color: 'var(--color-text)' }}>{listing.title}</div>
                <div className="red mt-2" style={{ fontWeight: 700 }}>{fmtPrice(listing.price, listing.currency)}</div>
                {featuredUntil && <div className="text-sm muted mt-2">Already featured until {fmtDate(featuredUntil)}. Buying again adds days after that date.</div>}
              </div>
            </section>

            {!isLive ? (
              <div className="alert alert-warning" role="status">
                <Icon name="alert" />
                <div>Only live listings can be featured. This one is {listing.isActive ? 'still waiting for review' : 'inactive'}, so there is nothing for buyers to see yet.</div>
              </div>
            ) : (
              <>
                <section className="card" aria-labelledby="what-h">
                  <div className="card-head"><h2 id="what-h" className="card-title">What you get</h2></div>
                  <ul className="card-pad stack gap-3" style={{ listStyle: 'none' }}>
                    {BENEFITS.map((b) => (
                      <li key={b} className="row gap-3"><span className="red" style={{ display: 'inline-flex' }}><Icon name="checkCircle" /></span> {b}</li>
                    ))}
                  </ul>
                </section>

                <section className="card" aria-labelledby="dur-h">
                  <div className="card-head"><h2 id="dur-h" className="card-title">How long?</h2></div>
                  <div className="card-pad boost-options" role="radiogroup" aria-labelledby="dur-h">
                    {durations.map((d) => (
                      <label key={d} className={`boost-option${duration === d ? ' is-selected' : ''}`}>
                        <input type="radio" name="duration" className="sr-only" value={d} checked={duration === d} onChange={() => setDuration(d)} />
                        <span className="boost-option-days">{d} days</span>
                        <span className="boost-option-price">GHS {prices[d].toLocaleString()}</span>
                        <span className="text-xs muted">GHS {(prices[d] / d).toFixed(2)} per day</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="card card-pad row wrap gap-4" style={{ justifyContent: 'space-between' }} aria-label="Payment">
                  <div>
                    <div className="text-sm muted">Featured for {duration} days</div>
                    <div className="price-lg">GHS {price.toLocaleString()}</div>
                  </div>
                  <button type="button" className="btn btn-primary btn-lg" onClick={pay} disabled={submitting || !price}>
                    {submitting ? <><span className="spinner" /> Opening Paystack…</> : <><Icon name="card" /> Pay with Paystack</>}
                  </button>
                  <p className="text-sm muted" style={{ flexBasis: '100%' }}>
                    You pay on Paystack's secure page by mobile money or card, then come straight back here. Featured status starts as soon as payment is confirmed.
                  </p>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </DealerLayout>
  );
}
