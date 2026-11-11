import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';
import Icon from '../../components/Icon';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PageHeader, EmptyState } from '../../components/DashboardShell';
import { fmtPrice } from '../../components/CarCard';
import axiosInstance from '../../api/axiosInstance';
import { getPlaceholder } from '../../utils/placeholder';

const PLACEHOLDER = getPlaceholder(64, 46);
const TIER_BADGE = { basic: '', pro: 'badge-red', premium: 'badge-solid' };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

const Info = ({ label, value }) => (
  <div>
    <dt className="label-caps">{label}</dt>
    <dd className="mt-2" style={{ color: value ? 'var(--color-text)' : 'var(--color-text-muted)', overflowWrap: 'anywhere' }}>{value || 'Not provided'}</dd>
  </div>
);

const listingStatus = (l) => {
  if (l.isApproved) return <span className="badge badge-success">Live</span>;
  if (l.isActive) return <span className="badge badge-warning">Pending</span>;
  return <span className="badge badge-error">Rejected</span>;
};

export default function AdminDealerDetail() {
  const { dealerId } = useParams();
  const [dealer, setDealer] = useState(null);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/admin/dealers/${dealerId}`);
      setDealer(data.dealer);
      setListings(data.listings || []);
      setStats(data.stats || null);
    } catch {
      toast.error('The dealer profile could not be loaded');
    } finally {
      setLoading(false);
    }
  }, [dealerId]);

  useEffect(() => { load(); }, [load]);

  const act = async (endpoint, successMsg, update) => {
    setActing(endpoint);
    try {
      await axiosInstance.put(`/admin/dealers/${dealerId}/${endpoint}`);
      setDealer((prev) => ({ ...prev, ...update }));
      toast.success(successMsg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActing(null);
      setConfirm(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="stack gap-4">{[200, 120, 300].map((h) => <div key={h} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-md)' }} />)}</div>
      </AdminLayout>
    );
  }

  if (!dealer) {
    return (
      <AdminLayout>
        <div className="card"><EmptyState icon="store" title="Dealer not found" action={<Link to="/admin/dealers" className="btn btn-secondary"><Icon name="arrowLeft" /> Back to dealers</Link>} /></div>
      </AdminLayout>
    );
  }

  const tier = dealer.subscriptionTier || 'basic';

  return (
    <AdminLayout>
      <PageHeader back={{ to: '/admin/dealers', label: 'Dealers' }} title={dealer.businessName} />

      <section className="card mb-6" style={{ overflow: 'hidden' }}>
        <div style={{ height: 150, background: dealer.coverImage ? `center / cover no-repeat url("${dealer.coverImage}")` : 'radial-gradient(500px 200px at 80% 0%, rgba(196,30,42,.25), transparent 70%), var(--color-surface-2)' }} />
        <div className="card-pad row wrap between gap-4" style={{ marginTop: -48, alignItems: 'flex-end' }}>
          <div className="row gap-4" style={{ alignItems: 'flex-end' }}>
            {dealer.logo
              ? <img src={dealer.logo} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--color-surface)' }} />
              : <span className="avatar" style={{ width: 88, height: 88, fontSize: '1.6rem', border: '4px solid var(--color-surface)' }}>{dealer.businessName?.[0]}</span>}
            <div className="row wrap gap-2" style={{ paddingBottom: 6 }}>
              <span className={`badge ${dealer.isApproved ? 'badge-success' : 'badge-warning'}`}>{dealer.isApproved ? 'Approved' : 'Pending'}</span>
              {dealer.isVerified && <span className="badge badge-red"><Icon name="checkCircle" /> Verified</span>}
              <span className={`badge ${TIER_BADGE[tier]}`} style={{ textTransform: 'capitalize' }}>{tier}</span>
            </div>
          </div>
          <div className="row wrap gap-2">
            {!dealer.isApproved && (
              <button type="button" className="btn btn-success" disabled={!!acting} onClick={() => act('approve', 'Dealer approved', { isApproved: true })}>
                {acting === 'approve' ? <span className="spinner" /> : <><Icon name="check" /> Approve</>}
              </button>
            )}
            {!dealer.isVerified && (
              <button type="button" className="btn btn-secondary" disabled={!!acting} onClick={() => act('verify', 'Dealer verified', { isVerified: true })}>
                {acting === 'verify' ? <span className="spinner" /> : <><Icon name="shield" /> Verify</>}
              </button>
            )}
            {dealer.isApproved
              ? <button type="button" className="btn btn-danger" disabled={!!acting} onClick={() => setConfirm({ ep: 'suspend', title: 'Suspend this dealer?', msg: 'Dealer suspended', label: 'Suspend' })}>Suspend</button>
              : <button type="button" className="btn btn-danger" disabled={!!acting} onClick={() => setConfirm({ ep: 'reject', title: 'Reject this dealer?', msg: 'Dealer rejected', label: 'Reject' })}>Reject</button>}
          </div>
        </div>
      </section>

      <div className="grid-4 mb-6">
        {[['Listings', stats?.totalListings], ['Active', stats?.activeListings], ['Views', stats?.totalViews], ['Enquiries', stats?.totalEnquiries]].map(([k, v]) => (
          <div key={k} className="stat"><div className="stat-label">{k}</div><div className="stat-value" style={{ fontSize: 'var(--fs-2xl)' }}>{(v ?? 0).toLocaleString()}</div></div>
        ))}
      </div>

      <div className="grid-2 mb-6" style={{ gap: 'var(--sp-6)', alignItems: 'start' }}>
        <section className="card card-pad" aria-labelledby="biz-h">
          <h2 id="biz-h" className="panel-title">Business</h2>
          <dl className="grid-2" style={{ gap: 'var(--sp-5)' }}>
            <Info label="Business name" value={dealer.businessName} />
            <Info label="Region" value={dealer.region} />
            <div style={{ gridColumn: '1 / -1' }}><Info label="Address" value={dealer.businessAddress} /></div>
            <Info label="Phone" value={dealer.phone} />
            <Info label="WhatsApp" value={dealer.whatsapp} />
            <Info label="Dealer since" value={fmtDate(dealer.createdAt)} />
            <Info label="Plan expires" value={fmtDate(dealer.subscriptionExpiry)} />
            {dealer.description && <div style={{ gridColumn: '1 / -1' }}><Info label="About" value={dealer.description} /></div>}
          </dl>
        </section>

        <section className="card card-pad" aria-labelledby="own-h">
          <h2 id="own-h" className="panel-title">Account owner</h2>
          <div className="row gap-3 mb-6">
            {dealer.user?.avatar
              ? <img src={dealer.user.avatar} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
              : <span className="avatar" style={{ width: 48, height: 48, flexShrink: 0 }}>{dealer.user?.name?.[0]}</span>}
            <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{dealer.user?.name}</div>
              <div className="text-sm muted">{dealer.user?.email}</div>
            </div>
          </div>
          <dl className="grid-2" style={{ gap: 'var(--sp-5)' }}>
            <Info label="Phone" value={dealer.user?.phone} />
            <Info label="Account" value={dealer.user?.isActive === false ? 'Disabled' : 'Active'} />
            <Info label="Created" value={fmtDate(dealer.user?.createdAt)} />
          </dl>
        </section>
      </div>

      <section className="card" aria-labelledby="dl-h">
        <div className="card-head"><h2 id="dl-h" className="card-title">Listings ({listings.length})</h2></div>
        {listings.length === 0 ? <EmptyState icon="car" title="No listings yet" /> : (
          <ul style={{ listStyle: 'none' }}>
            {listings.map((l) => (
              <li key={l._id}>
                <Link to={`/admin/listings/${l._id}`} className="row gap-3" style={{ padding: 'var(--sp-3) var(--sp-5)', borderBottom: '1px solid var(--color-border-soft)', color: 'inherit' }}>
                  <img src={l.images?.[0] || PLACEHOLDER} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} style={{ width: 64, height: 46, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)', flexShrink: 0 }} />
                  <div className="grow">
                    <div className="truncate" style={{ fontWeight: 600 }}>{l.title}</div>
                    <div className="text-xs muted mt-2">{fmtPrice(l.price, l.currency)} · {l.views || 0} views</div>
                  </div>
                  {listingStatus(l)}
                  <Icon name="chevRight" style={{ color: 'var(--color-text-muted)' }} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={!!confirm}
        danger
        busy={!!acting}
        title={confirm?.title}
        body={`${dealer.businessName}'s listings will stop showing to buyers.`}
        confirmLabel={confirm?.label}
        onConfirm={() => act(confirm.ep, confirm.msg, { isApproved: false })}
        onCancel={() => setConfirm(null)}
      />
    </AdminLayout>
  );
}
