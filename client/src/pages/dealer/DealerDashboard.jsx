import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DealerLayout from './DealerLayout';
import Icon from '../../components/Icon';
import { PageHeader, StatusBadge, TableSkeleton, EmptyState } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';

const TYPE_LABEL = { general: 'General', price: 'Price', test_drive: 'Test drive', finance: 'Finance' };

const Stat = ({ label, value, loading, sub }) => (
  <div className="stat">
    <div className="stat-label">{label}</div>
    <div className="stat-value">{loading ? <span className="skeleton" style={{ display: 'block', height: 34, width: 70 }} /> : (value ?? 0)}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

export default function DealerDashboard() {
  const [stats, setStats] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/dealers/stats'),
      axiosInstance.get('/dealers/enquiries?limit=5'),
      axiosInstance.get('/dealers/profile'),
    ]).then(([s, e, d]) => {
      setStats(s.data);
      setEnquiries(e.data.enquiries?.slice(0, 5) || []);
      setDealer(d.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <DealerLayout>
      {dealer && !dealer.isApproved && (
        <div className="alert alert-warning mb-6" role="status">
          <Icon name="clock" />
          <div>
            <strong>Your dealership is pending approval.</strong> You can add listings now; buyers will see them once an admin approves your account.
          </div>
        </div>
      )}

      <PageHeader
        title={dealer?.businessName ? `Welcome, ${dealer.businessName}` : 'Overview'}
        subtitle="How your listings are performing."
        actions={<Link to="/dealer/listings/create" className="btn btn-primary"><Icon name="plus" /> Add a listing</Link>}
      />

      <div className="grid-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <Stat label="Active listings" value={stats?.activeListings} loading={loading} sub={stats && `${stats.totalListings ?? 0} total`} />
        <Stat label="Total views" value={stats?.totalViews?.toLocaleString()} loading={loading} />
        <Stat label="Enquiries" value={stats?.totalEnquiries} loading={loading} />
        <Stat label="New enquiries" value={stats?.newEnquiries} loading={loading} sub="Not yet read" />
      </div>

      <div className="split split-narrow">
        <section className="card" aria-labelledby="enq-h">
          <div className="card-head"><h2 id="enq-h" className="card-title">Recent enquiries</h2></div>
          {loading ? <TableSkeleton rows={4} cols={3} /> : enquiries.length === 0 ? (
            <EmptyState icon="message" title="No enquiries yet">
              When a buyer contacts you about a car, it appears here and is emailed to you.
            </EmptyState>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {enquiries.map((e) => (
                <li key={e._id} className="row between gap-4" style={{ padding: 'var(--sp-4) var(--sp-5)', borderBottom: '1px solid var(--color-border-soft)' }}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="truncate" style={{ fontWeight: 600, color: 'var(--color-text)' }}>{e.listing?.title || 'Listing removed'}</div>
                    <div className="text-xs muted mt-2">{e.user?.name || e.guestName || 'Guest'} · {TYPE_LABEL[e.type] || e.type}</div>
                  </div>
                  <div className="stack gap-2" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                    <StatusBadge status={e.status} />
                    <span className="text-xs muted">{new Date(e.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card card-pad stack gap-3" aria-labelledby="qa-h">
          <h2 id="qa-h" className="card-title mb-2">Quick actions</h2>
          <Link to="/dealer/listings/create" className="btn btn-primary btn-block"><Icon name="plus" /> Add a listing</Link>
          <Link to="/dealer/listings" className="btn btn-secondary btn-block"><Icon name="list" /> Manage listings</Link>
          <Link to="/dealer/profile" className="btn btn-secondary btn-block"><Icon name="store" /> Edit dealer profile</Link>
        </section>
      </div>
    </DealerLayout>
  );
}
