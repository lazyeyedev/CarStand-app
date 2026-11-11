import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BoostBadge from '../components/BoostBadge';
import Icon from '../components/Icon';
import { fmtPrice } from '../components/CarCard';
import { whatsappLink } from '../utils/whatsapp';
import ImageLightbox from '../components/ImageLightbox';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { getPlaceholder } from '../utils/placeholder';

const PLACEHOLDER = getPlaceholder(800, 520);

const guestSchema = yup.object({
  guestName: yup.string().required('Enter your name'),
  guestEmail: yup.string().email('Enter a valid email').required('Enter your email'),
  guestPhone: yup.string().required('Enter a phone number the dealer can call'),
  message: yup.string().required('Write a short message to the dealer'),
  type: yup.string(),
});
const authSchema = yup.object({
  message: yup.string().required('Write a short message to the dealer'),
  type: yup.string(),
});

const ErrorText = ({ id, err }) => err ? <div id={id} className="field-error" role="alert"><Icon name="alert" />{err.message}</div> : null;

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const isGuest = !user;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(isGuest ? guestSchema : authSchema),
    defaultValues: { type: 'general' },
  });

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(`/listings/${id}`)
      .then((r) => { setListing(r.data); setIdx(0); })
      .catch(() => setError('This listing was not found or is no longer available.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Put the car in the tab title while this page is open, and restore the
  // site title on the way out so other pages don't keep the car's name.
  useEffect(() => {
    if (!listing) return undefined;
    const siteTitle = "Carmium — Ghana's Premier Car Marketplace";
    document.title = `${listing.title} · Carmium`;
    return () => { document.title = siteTitle; };
  }, [listing]);

  const onEnquiry = async (data) => {
    setSubmitting(true);
    try {
      await axiosInstance.post(`/listings/${id}/enquiry`, data);
      toast.success('Enquiry sent. The dealer will contact you.');
      reset({ type: 'general' });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Your enquiry could not be sent. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="container section-sm">
          <div className="split">
            <div className="stack gap-4">
              <div className="skeleton" style={{ aspectRatio: '16/10', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton" style={{ height: 32, width: '60%' }} />
              <div className="skeleton" style={{ height: 40, width: '35%' }} />
            </div>
            <div className="skeleton" style={{ height: 420, borderRadius: 'var(--radius-md)' }} />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Navbar />
        <main className="container section">
          <div className="card empty">
            <Icon name="car" />
            <h3>Listing unavailable</h3>
            <p>{error}</p>
            <Link to="/listings" className="btn btn-primary"><Icon name="arrowLeft" /> Back to all cars</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : [PLACEHOLDER];
  const hasPhotos = Boolean(listing.images?.length);
  const dealer = listing.dealer;
  const go = (d) => setIdx((i) => (i + d + images.length) % images.length);
  const specs = [
    ['Make', listing.make], ['Model', listing.model], ['Year', listing.year],
    ['Condition', listing.condition], ['Body type', listing.bodyType],
    ['Transmission', listing.transmission], ['Fuel', listing.fuelType], ['Colour', listing.color],
    ['Mileage', listing.mileage ? `${Number(listing.mileage).toLocaleString()} ${listing.mileageUnit || 'km'}` : null],
    ['Region', listing.region], ['Location', listing.location],
  ].filter(([, v]) => v);

  return (
    <div className="page">
      <Navbar />
      <main id="main" className="page-main container section-sm">
        <nav aria-label="Breadcrumb" className="row gap-2 text-sm muted mb-4 wrap">
          <Link to="/" className="muted">Home</Link><Icon name="chevRight" size={14} />
          <Link to="/listings" className="muted">Cars</Link><Icon name="chevRight" size={14} />
          <span className="truncate" aria-current="page" style={{ color: 'var(--text-2)', maxWidth: '40ch' }}>{listing.title}</span>
        </nav>

        <div className="split">
          <div className="stack gap-6" style={{ minWidth: 0 }}>
            <div>
              <div
                className={`gallery-main${hasPhotos ? ' is-openable' : ''}`}
                tabIndex={images.length > 1 ? 0 : undefined}
                onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); }}
                aria-roledescription="carousel"
                aria-label={`${listing.title} photos`}
              >
                <img
                  src={images[idx]}
                  alt={`${listing.title} (${idx + 1} of ${images.length})`}
                  onClick={hasPhotos ? () => setViewerOpen(true) : undefined}
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                />
                {hasPhotos && (
                  <button type="button" className="gallery-expand" onClick={() => setViewerOpen(true)} aria-label="View photos full screen">
                    <Icon name="expand" /> View full screen
                  </button>
                )}
                {listing.isBoosted && <div className="car-card-flag"><BoostBadge /></div>}
                {images.length > 1 && (
                  <>
                    <button type="button" className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo"><Icon name="chevLeft" /></button>
                    <button type="button" className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo"><Icon name="chevRight" /></button>
                    <span className="gallery-count">{idx + 1} / {images.length}</span>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="thumbs">
                  {images.map((img, i) => (
                    <button key={img + i} type="button" className={`thumb${i === idx ? ' is-active' : ''}`} onClick={() => setIdx(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === idx}>
                      <img src={img} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="row wrap gap-2 mb-2">
                {listing.condition && <span className="badge" style={{ textTransform: 'capitalize' }}>{listing.condition}</span>}
                {listing.year && <span className="badge">{listing.year}</span>}
                <span className="badge"><Icon name="eye" /> {listing.views || 0} views</span>
              </div>
              <h1 style={{ fontSize: 'var(--fs-3xl)' }}>{listing.title}</h1>
              <div className="price-lg mt-2">{fmtPrice(listing.price, listing.currency)}</div>
            </div>

            <section aria-labelledby="specs-h">
              <h2 id="specs-h" className="panel-title">Vehicle details</h2>
              <dl className="spec-grid">
                {specs.map(([k, v]) => (
                  <div key={k} className="spec"><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            </section>

            {listing.description && (
              <section aria-labelledby="desc-h" className="card card-pad">
                <h2 id="desc-h" className="panel-title">Description</h2>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>{listing.description}</p>
              </section>
            )}
          </div>

          <aside className="sticky-col stack gap-4">
            {dealer && (
              <div className="card card-pad">
                <div className="row gap-3 mb-4">
                  {dealer.logo
                    ? <img src={dealer.logo} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                    : <span className="avatar" style={{ width: 52, height: 52, fontSize: '1.1rem' }}>{dealer.businessName?.[0]}</span>}
                  <div className="grow">
                    <div className="row gap-2 wrap">
                      <strong className="truncate">{dealer.businessName}</strong>
                      {dealer.isVerified && <span className="badge badge-red"><Icon name="checkCircle" /> Verified</span>}
                    </div>
                    {dealer.region && <div className="text-sm muted row gap-1 mt-2"><Icon name="pin" size={14} /> {dealer.region}</div>}
                  </div>
                </div>
                <div className="stack gap-2">
                  {dealer.phone && <a href={`tel:${dealer.phone}`} className="btn btn-secondary btn-block"><Icon name="phone" /> Call {dealer.phone}</a>}
                  {dealer.whatsapp && (
                    <a href={whatsappLink(dealer.whatsapp)} target="_blank" rel="noreferrer" className="btn btn-success btn-block">
                      <Icon name="message" /> Chat on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="card card-pad">
              <h2 className="card-title mb-4">Send an enquiry</h2>
              {sent ? (
                <div className="alert alert-success">
                  <Icon name="checkCircle" />
                  <div>
                    <strong>Enquiry sent.</strong> The dealer has your details and will get back to you.
                    <div className="mt-2"><button type="button" className="link-btn" onClick={() => setSent(false)}>Send another</button></div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onEnquiry)} noValidate className="stack gap-3">
                  {isGuest ? (
                    <>
                      <div className="field">
                        <label className="label" htmlFor="e-name">Your name</label>
                        <input id="e-name" className="input" autoComplete="name" aria-invalid={!!errors.guestName} aria-describedby="e-name-err" {...register('guestName')} />
                        <ErrorText id="e-name-err" err={errors.guestName} />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="e-email">Email</label>
                        <input id="e-email" type="email" className="input" autoComplete="email" aria-invalid={!!errors.guestEmail} aria-describedby="e-email-err" {...register('guestEmail')} />
                        <ErrorText id="e-email-err" err={errors.guestEmail} />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="e-phone">Phone</label>
                        <input id="e-phone" type="tel" className="input" autoComplete="tel" placeholder="0244 000 000" aria-invalid={!!errors.guestPhone} aria-describedby="e-phone-err" {...register('guestPhone')} />
                        <ErrorText id="e-phone-err" err={errors.guestPhone} />
                      </div>
                    </>
                  ) : (
                    <div className="alert"><Icon name="user" /><span>Sending as <strong>{user.name}</strong></span></div>
                  )}
                  <div className="field">
                    <label className="label" htmlFor="e-type">What is it about?</label>
                    <select id="e-type" className="select" {...register('type')}>
                      <option value="general">General question</option>
                      <option value="price">Price negotiation</option>
                      <option value="test_drive">Test drive</option>
                      <option value="finance">Finance / loan</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="e-msg">Message</label>
                    <textarea id="e-msg" className="textarea" rows={4} placeholder="Hi, is this car still available?" aria-invalid={!!errors.message} aria-describedby="e-msg-err" {...register('message')} />
                    <ErrorText id="e-msg-err" err={errors.message} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                    {submitting ? <><span className="spinner" /> Sending…</> : 'Send enquiry'}
                  </button>
                </form>
              )}
            </div>

            <div className="grid-2">
              <div className="stat"><div className="stat-label">Views</div><div className="stat-value" style={{ fontSize: 'var(--fs-2xl)' }}>{listing.views || 0}</div></div>
              <div className="stat"><div className="stat-label">Enquiries</div><div className="stat-value" style={{ fontSize: 'var(--fs-2xl)' }}>{listing.enquiryCount || 0}</div></div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
      {viewerOpen && (
        <ImageLightbox
          images={images}
          index={idx}
          onIndexChange={setIdx}
          onClose={() => setViewerOpen(false)}
          title={listing.title}
          placeholder={PLACEHOLDER}
        />
      )}
    </div>
  );
}
