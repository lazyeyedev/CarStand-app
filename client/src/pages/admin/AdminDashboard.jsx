import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';
import Icon from '../../components/Icon';
import { PageHeader, TableSkeleton, EmptyState } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';

const Stat = ({ label, value, loading, attention, to }) => {
  const body = (
    <>
      <div className="stat-label row between">{label}{attention && value > 0 && <span className="badge badge-warning">Needs review</span>}</div>
      <div className="stat-value">{loading ? <span className="skeleton" style={{ display: 'block', height: 34, width: 64 }} /> : (value ?? 0).toLocaleString()}</div>
    </>
  );
  return to ? <Link to={to} className="stat" style={{ color: 'inherit', display: 'block' }}>{body}</Link> : <div className="stat">{body}</div>;
};

function Queue({ title, to, loading, items, empty, render }) {
  return (
    <section className="card" aria-label={title}>
      <div className="card-head">
        <h2 className="card-title row gap-2">{title} {!loading && items.length > 0 && <span className="badge badge-warning">{items.length}</span>}</h2>
        <Link to={to} className="text-sm">View all</Link>
      </div>
      {loading ? <TableSkeleton rows={3} cols={2} /> : items.length === 0
        ? <EmptyState icon="checkCircle" title="All caught up">{empty}</EmptyState>
        : <ul style={{ listStyle: 'none' }}>{items.map(render)}</ul>}
    </section>
  );
}

const rowStyle = { padding: 'var(--sp-3) var(--sp-5)', borderBottom: '1px solid var(--color-border-soft)' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState({ dealers: [], listings: [] });
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/admin/stats'),
      axiosInstance.get('/admin/dealers?approved=false&limit=5'),
      axiosInstance.get('/admin/listings?approved=false&limit=5'),
    ]).then(([s, d, l]) => {
      setStats(s.data);
      setPending({ dealers: d.data.dealers || [], listings: l.data.listings || [] });
    }).catch(() => toast.error('The dashboard could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  const approve = async (kind, id) => {
    setApproving((p) => ({ ...p, [id]: true }));
    try {
      await axiosInstance.put(`/admin/${kind}/${id}/approve`);
      setPending((p) => ({ ...p, [kind]: p[kind].filter((x) => x._id !== id) }));
      const key = kind === 'dealers' ? 'pendingDealers' : 'pendingListings';
      setStats((s) => (s ? { ...s, [key]: s[key] - 1 } : s));
      toast.success(kind === 'dealers' ? 'Dealer approved' : 'Listing approved');
    } catch {
      toast.error('Approval failed');
    } finally {
      setApproving((p) => ({ ...p, [id]: false }));
    }
  };

  const ApproveBtn = ({ kind, id, label }) => (
    <button type="button" className="btn btn-success btn-sm" onClick={() => approve(kind, id)} disabled={approving[id]} aria-label={`Approve ${label}`}>
      {approving[id] ? <span className="spinner" /> : <><Icon name="check" /> Approve</>}
    </button>
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--sp-4)' }}>
        <Stat label="Pending dealers" value={stats?.pendingDealers} loading={loading} attention to="/admin/dealers?approved=false" />
        <Stat label="Pending listings" value={stats?.pendingListings} loading={loading} attention to="/admin/listings?approved=false" />
        <Stat label="Dealers" value={stats?.totalDealers} loading={loading} to="/admin/dealers" />
        <Stat label="Listings" value={stats?.totalListings} loading={loading} to="/admin/listings" />
        <Stat label="Users" value={stats?.totalUsers} loading={loading} to="/admin/users" />
        <Stat label="Enquiries" value={stats?.totalEnquiries} loading={loading} />
        <Stat label="Active boosts" value={stats?.activeBoosts} loading={loading} to="/admin/boosts" />
      </div>

      <div className="grid-2" style={{ gap: 'var(--sp-6)', alignItems: 'start' }}>
        <Queue
          title="Dealers awaiting approval"
          to="/admin/dealers?approved=false"
          loading={loading}
          items={pending.dealers}
          empty="No dealers are waiting for review."
          render={(d) => (
            <li key={d._id} className="row between gap-4" style={rowStyle}>
              <div className="grow">
                <Link to={`/admin/dealers/${d._id}`} className="truncate" style={{ display: 'block', fontWeight: 600, color: 'var(--color-text)' }}>{d.businessName}</Link>
                <div className="text-xs muted mt-2">{[d.user?.name, d.region].filter(Boolean).join(' · ')}</div>
              </div>
              <ApproveBtn kind="dealers" id={d._id} label={d.businessName} />
            </li>
          )}
        />
        <Queue
          title="Listings awaiting approval"
          to="/admin/listings?approved=false"
          loading={loading}
          items={pending.listings}
          empty="No listings are waiting for review."
          render={(l) => (
            <li key={l._id} className="row between gap-4" style={rowStyle}>
              <div className="grow">
                <Link to={`/admin/listings/${l._id}`} className="truncate" style={{ display: 'block', fontWeight: 600, color: 'var(--color-text)' }}>{l.title}</Link>
                <div className="text-xs muted mt-2">{[l.dealer?.businessName, l.region].filter(Boolean).join(' · ')}</div>
              </div>
              <ApproveBtn kind="listings" id={l._id} label={l.title} />
            </li>
          )}
        />
      </div>
    </AdminLayout>
  );
}
