import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';
import axiosInstance from '../../api/axiosInstance';
import { getPlaceholder } from '../../utils/placeholder';

const TIER_COLOR = { basic: '#666', pro: '#c41e2a', premium: '#e8a0a6' };
const PLACEHOLDER = getPlaceholder(64, 46);

const Badge = ({ label, bg, color }) => (
  <span style={{ background: bg, color, fontSize: '0.7rem', padding: '2px 8px',
    borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
);

const ActionBtn = ({ label, onClick, color = '#ccc', bg = '#1e1e1e', disabled }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ background: bg, border: '1px solid #2a2a2a', color, borderRadius: 5,
      padding: '5px 14px', fontSize: '0.8rem', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1, fontWeight: 600 }}>
    {label}
  </button>
);

const Field = ({ label, value }) => (
  <div style={{ marginBottom: '0.9rem' }}>
    <div style={{ color: '#555', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
    <div style={{ color: '#ececec', fontSize: '0.88rem' }}>{value || <span style={{ color: '#333' }}>—</span>}</div>
  </div>
);

const StatBox = ({ label, value }) => (
  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
    padding: '0.9rem', textAlign: 'center', flex: 1, minWidth: 100 }}>
    <div style={{ color: '#c41e2a', fontWeight: 800, fontSize: '1.3rem' }}>{value ?? 0}</div>
    <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 3 }}>{label}</div>
  </div>
);

export default function AdminDealerDetail() {
  const { dealerId } = useParams();
  const [dealer, setDealer]   = useState(null);
  const [listings, setListings] = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/admin/dealers/${dealerId}`);
      setDealer(data.dealer);
      setListings(data.listings || []);
      setStats(data.stats || null);
    } catch {
      toast.error('Failed to load dealer profile');
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
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#444' }}>Loading…</div>
      </AdminLayout>
    );
  }

  if (!dealer) {
    return (
      <AdminLayout>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#555' }}>
          Dealer not found.
          <div style={{ marginTop: '1rem' }}>
            <Link to="/admin/dealers" style={{ color: '#c41e2a' }}>← Back to dealers</Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/admin/dealers" style={{ color: '#555', fontSize: '0.82rem' }}>← Back to Dealers</Link>
      </div>

      {/* Cover + header */}
      <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{ height: 140, background: dealer.coverImage ? `url(${dealer.coverImage}) center/cover` : '#1a1a1a' }} />
        <div style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: -48 }}>
          {dealer.logo
            ? <img src={dealer.logo} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #141414', background: '#141414', flexShrink: 0 }} />
            : <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#1e1e1e', border: '3px solid #141414', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c41e2a', fontWeight: 800, fontSize: '1.8rem', flexShrink: 0 }}>
                {dealer.businessName?.[0]}
              </div>}
          <div style={{ flex: 1, minWidth: 200, paddingTop: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ color: '#ececec', fontSize: '1.3rem', fontWeight: 700 }}>{dealer.businessName}</h1>
              {dealer.isVerified && <Badge label="Verified" bg="#c41e2a22" color="#c41e2a" />}
              {dealer.isApproved
                ? <Badge label="Approved" bg="#52c07a22" color="#52c07a" />
                : <Badge label="Pending" bg="#c41e2a22" color="#c41e2a" />}
              <span style={{ color: TIER_COLOR[dealer.subscriptionTier] || '#888', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                {dealer.subscriptionTier} plan
              </span>
            </div>
            <div style={{ color: '#666', fontSize: '0.82rem', marginTop: 4 }}>{dealer.businessAddress} · {dealer.region}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: 50 }}>
            {!dealer.isApproved && (
              <ActionBtn label={acting === 'approve' ? '…' : 'Approve'} bg="#c41e2a" color="#0d0d0d"
                onClick={() => act('approve', 'Dealer approved', { isApproved: true })} disabled={!!acting} />
            )}
            {dealer.isApproved && (
              <ActionBtn label={acting === 'suspend' ? '…' : 'Suspend'} color="#e05252"
                onClick={() => act('suspend', 'Dealer suspended', { isApproved: false })} disabled={!!acting} />
            )}
            {!dealer.isVerified && (
              <ActionBtn label={acting === 'verify' ? '…' : 'Verify'} color="#52c07a"
                onClick={() => act('verify', 'Dealer verified', { isVerified: true })} disabled={!!acting} />
            )}
            <ActionBtn label={acting === 'reject' ? '…' : 'Reject'} color="#666"
              onClick={() => act('reject', 'Dealer rejected', { isApproved: false })} disabled={!!acting} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }} className="detail-cols">
        {/* Business info */}
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ color: '#c41e2a', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1e1e1e' }}>
            Business Details
          </div>
          <Field label="Business Name" value={dealer.businessName} />
          <Field label="Business Address" value={dealer.businessAddress} />
          <Field label="Region" value={dealer.region} />
          <Field label="Phone" value={dealer.phone} />
          <Field label="WhatsApp" value={dealer.whatsapp} />
          <Field label="Description" value={dealer.description} />
          <Field label="Subscription Tier" value={<span style={{ textTransform: 'capitalize' }}>{dealer.subscriptionTier}</span>} />
          <Field label="Subscription Expiry" value={dealer.subscriptionExpiry ? new Date(dealer.subscriptionExpiry).toLocaleDateString() : null} />
          <Field label="Dealer Since" value={new Date(dealer.createdAt).toLocaleDateString()} />
        </div>

        {/* Owner / account info */}
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 10, padding: '1.25rem' }}>
          <div style={{ color: '#c41e2a', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1e1e1e' }}>
            Owner Account
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
            {dealer.user?.avatar
              ? <img src={dealer.user.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid #2a2a2a' }} />
              : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1e1e1e', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c41e2a', fontWeight: 800 }}>
                  {dealer.user?.name?.[0]?.toUpperCase()}
                </div>}
            <div>
              <div style={{ color: '#ececec', fontWeight: 600, fontSize: '0.9rem' }}>{dealer.user?.name}</div>
              <div style={{ color: '#666', fontSize: '0.78rem' }}>{dealer.user?.email}</div>
            </div>
          </div>
          <Field label="Account Phone" value={dealer.user?.phone} />
          <Field label="Account Status" value={dealer.user?.isActive
            ? <span style={{ color: '#52c07a' }}>Active</span>
            : <span style={{ color: '#e05252' }}>Deactivated</span>} />
          <Field label="Account Created" value={dealer.user?.createdAt ? new Date(dealer.user.createdAt).toLocaleDateString() : null} />

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1e1e1e' }}>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <StatBox label="Listings" value={stats?.totalListings} />
              <StatBox label="Active" value={stats?.activeListings} />
              <StatBox label="Views" value={stats?.totalViews} />
              <StatBox label="Enquiries" value={stats?.totalEnquiries} />
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1e1e1e' }}>
          <span style={{ color: '#ececec', fontWeight: 700, fontSize: '0.92rem' }}>Listings ({listings.length})</span>
        </div>
        {listings.length === 0
          ? <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>No listings yet.</div>
          : listings.map((l) => (
              <Link key={l._id} to={`/admin/listings/${l._id}`}
                style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 12,
                  textDecoration: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <img src={l.images?.[0] || PLACEHOLDER} alt="" onError={(e) => { e.target.src = PLACEHOLDER; }}
                  style={{ width: 64, height: 46, objectFit: 'cover', borderRadius: 5, border: '1px solid #2a2a2a', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#ececec', fontSize: '0.84rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                  <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>
                    {l.currency === 'USD' ? '$' : 'GHS '}{Number(l.price).toLocaleString()} · {l.views || 0} views
                  </div>
                </div>
                {l.isApproved
                  ? <Badge label="Approved" bg="#52c07a22" color="#52c07a" />
                  : l.isActive
                    ? <Badge label="Pending" bg="#c41e2a22" color="#c41e2a" />
                    : <Badge label="Rejected" bg="#e0525222" color="#e05252" />}
              </Link>
            ))}
      </div>

      <style>{`@media(max-width:800px){.detail-cols{grid-template-columns:1fr!important}}`}</style>
    </AdminLayout>
  );
}
