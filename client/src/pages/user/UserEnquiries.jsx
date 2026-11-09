import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Icon from '../../components/Icon';
import { PageHeader, StatusBadge, EmptyState } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';
import { getPlaceholder } from '../../utils/placeholder';

const PLACEHOLDER = getPlaceholder(96, 64);
const TYPE_LABEL = { general: 'General', price: 'Price negotiation', test_drive: 'Test drive', finance: 'Finance' };
const fmtDate = (d, time) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) });

export default function UserEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    axiosInstance.get('/users/enquiries')
      .then((r) => setEnquiries(r.data.enquiries || []))
      .catch(() => toast.error('Your enquiries could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main id="main" className="page-main container section-sm" style={{ maxWidth: 920 }}>
        <PageHeader
          title="My enquiries"
          subtitle={loading ? 'Loading…' : `${enquiries.length} ${enquiries.length === 1 ? 'enquiry' : 'enquiries'} sent`}
          actions={<Link to="/listings" className="btn btn-primary"><Icon name="search" /> Browse cars</Link>}
        />

        {loading ? (
          <div className="stack gap-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 92, borderRadius: 'var(--radius-md)' }} />)}</div>
        ) : enquiries.length === 0 ? (
          <div className="card">
            <EmptyState icon="message" title="No enquiries yet" action={<Link to="/listings" className="btn btn-primary">Find a car</Link>}>
              When you contact a dealer about a car, the conversation is tracked here.
            </EmptyState>
          </div>
        ) : (
          <ul className="stack gap-3" style={{ listStyle: 'none' }}>
            {enquiries.map((e) => {
              const open = expanded === e._id;
              const panelId = `enq-${e._id}`;
              return (
                <li key={e._id} className="card" style={{ overflow: 'hidden', borderColor: open ? 'var(--color-border-strong)' : undefined }}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : e._id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="row gap-4"
                    style={{ width: '100%', padding: 'var(--sp-4)', background: 'none', border: 0, textAlign: 'left' }}
                  >
                    <img src={e.listing?.images?.[0] || PLACEHOLDER} alt="" style={{ width: 84, height: 58, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }} onError={(ev) => { ev.currentTarget.src = PLACEHOLDER; }} />
                    <div className="grow">
                      <div className="truncate" style={{ fontWeight: 600 }}>{e.listing?.title || 'Listing no longer available'}</div>
                      <div className="text-xs muted mt-2">{[TYPE_LABEL[e.type] || e.type, e.dealer?.businessName, fmtDate(e.createdAt)].filter(Boolean).join(' · ')}</div>
                      {!open && <div className="text-sm muted truncate mt-2">{e.message}</div>}
                    </div>
                    <div className="stack gap-2" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                      <StatusBadge status={e.status} />
                      <Icon name="chevDown" style={{ color: 'var(--color-text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-fast) var(--ease)' }} />
                    </div>
                  </button>

                  {open && (
                    <div id={panelId} className="card-pad" style={{ borderTop: '1px solid var(--color-border-soft)', background: '#111' }}>
                      <div className="grid-2 mb-4">
                        <div><div className="label-caps">Type</div><div className="mt-2">{TYPE_LABEL[e.type] || e.type}</div></div>
                        <div><div className="label-caps">Dealer</div><div className="mt-2">{e.dealer?.businessName || 'Not available'}</div></div>
                      </div>
                      <div className="label-caps mb-2">Your message</div>
                      <p className="card card-pad-sm" style={{ background: 'var(--color-surface-2)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{e.message}</p>
                      <div className="row wrap between gap-2 mt-4">
                        <span className="text-xs muted">Sent {fmtDate(e.createdAt, true)}</span>
                        {e.listing?._id && <Link to={`/listings/${e.listing._id}`} className="btn btn-secondary btn-sm">View listing <Icon name="arrowRight" /></Link>}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
