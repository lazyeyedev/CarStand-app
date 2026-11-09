import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';
import ListingForm from '../dealer/ListingForm';
import Icon from '../../components/Icon';
import BoostBadge from '../../components/BoostBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PageHeader, EmptyState } from '../../components/DashboardShell';
import { fmtPrice } from '../../components/CarCard';
import axiosInstance from '../../api/axiosInstance';
import { getPlaceholder } from '../../utils/placeholder';

const PLACEHOLDER = getPlaceholder(600, 400);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

const statusBadge = (l) => {
  if (l.isApproved && l.isActive) return <span className="badge badge-success">Live</span>;
  if (!l.isApproved && l.isActive) return <span className="badge badge-warning">Pending review</span>;
  return <span className="badge badge-error">Rejected</span>;
};

export default function AdminListingDetail() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [idx, setIdx] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/admin/listings/${listingId}`);
      setListing(data);
    } catch {
      toast.error('The listing could not be loaded');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => { load(); }, [load]);

  const act = async (endpoint, successMsg, update) => {
    setActing(endpoint);
    try {
      await axiosInstance.put(`/admin/listings/${listingId}/${endpoint}`);
      setListing((prev) => ({ ...prev, ...update }));
      toast.success(successMsg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const confirmDelete = async () => {
    setActing('delete');
    try {
      await axiosInstance.delete(`/admin/listings/${listingId}`);
      toast.success('Listing permanently deleted');
      navigate('/admin/listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      setActing(null);
      setConfirmDel(false);
    }
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const { data } = await axiosInstance.put(`/admin/listings/${listingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setListing(data);
      setEditing(false);
      toast.success('Listing updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="split"><div className="skeleton" style={{ aspectRatio: '16/10', borderRadius: 'var(--radius-md)' }} /><div className="skeleton" style={{ height: 360, borderRadius: 'var(--radius-md)' }} /></div>
      </AdminLayout>
    );
  }

  if (!listing) {
    return (
      <AdminLayout>
        <div className="card"><EmptyState icon="car" title="Listing not found" action={<Link to="/admin/listings" className="btn btn-secondary"><Icon name="arrowLeft" /> Back to listings</Link>} /></div>
      </AdminLayout>
    );
  }

  if (editing) {
    return (
      <AdminLayout>
        <div style={{ maxWidth: 860 }}>
          <PageHeader
            title="Edit listing"
            subtitle="Editing as admin. Approval status is not changed by these edits."
            actions={<button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>}
          />
          <ListingForm defaultValues={listing} existingImages={listing.images || []} onSubmit={handleSave} submitLabel="Save changes" loading={saving} />
        </div>
      </AdminLayout>
    );
  }

  const images = listing.images?.length ? listing.images : [PLACEHOLDER];
  const details = [
    ['Make / model', [listing.make, listing.model].filter(Boolean).join(' ')],
    ['Year', listing.year], ['Condition', listing.condition], ['Body type', listing.bodyType],
    ['Transmission', listing.transmission], ['Fuel', listing.fuelType], ['Colour', listing.color],
    ['Mileage', listing.mileage ? `${Number(listing.mileage).toLocaleString()} ${listing.mileageUnit || 'km'}` : null],
    ['Region', listing.region], ['Area', listing.location],
  ];

  return (
    <AdminLayout>
      <PageHeader
        back={{ to: '/admin/listings', label: 'Listings' }}
        title={listing.title}
        actions={(
          <>
            {!listing.isApproved ? (
              <button type="button" className="btn btn-success" disabled={!!acting} onClick={() => act('approve', 'Listing approved', { isApproved: true, isActive: true })}>
                {acting === 'approve' ? <span className="spinner" /> : <><Icon name="check" /> Approve</>}
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" disabled={!!acting} onClick={() => act('reject', 'Listing rejected', { isApproved: false, isActive: false })}>
                {acting === 'reject' ? <span className="spinner" /> : <><Icon name="ban" /> Reject</>}
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)} disabled={!!acting}><Icon name="edit" /> Edit</button>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmDel(true)} disabled={!!acting} aria-label="Delete listing"><Icon name="trash" /></button>
          </>
        )}
      />

      <div className="split">
        <div className="stack gap-4" style={{ minWidth: 0 }}>
          <div>
            <div className="gallery-main">
              <img src={images[idx]} alt={`${listing.title} (${idx + 1} of ${images.length})`} onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
              {listing.isBoosted && <div className="car-card-flag"><BoostBadge /></div>}
              {images.length > 1 && <span className="gallery-count">{idx + 1} / {images.length}</span>}
            </div>
            {images.length > 1 && (
              <div className="thumbs">
                {images.map((img, i) => (
                  <button key={img + i} type="button" className={`thumb${i === idx ? ' is-active' : ''}`} onClick={() => setIdx(i)} aria-label={`Show photo ${i + 1}`}>
                    <img src={img} alt="" onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {listing.description && (
            <section className="card card-pad">
              <h2 className="panel-title">Description</h2>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{listing.description}</p>
            </section>
          )}
        </div>

        <aside className="stack gap-4">
          <section className="card card-pad">
            <div className="row wrap gap-2 mb-4">{statusBadge(listing)}{listing.isBoosted && <span className="badge badge-red"><Icon name="zap" /> Boosted</span>}</div>
            <div className="price-lg">{fmtPrice(listing.price, listing.currency)}</div>
            <div className="divider" />
            <div className="row between text-sm">
              <span className="muted">Dealer</span>
              {listing.dealer?._id
                ? <Link to={`/admin/dealers/${listing.dealer._id}`}>{listing.dealer.businessName}</Link>
                : <span>{listing.dealer?.businessName || 'Unknown'}</span>}
            </div>
            <div className="grid-2 mt-4">
              <div className="stat"><div className="stat-label">Views</div><div className="stat-value" style={{ fontSize: 'var(--fs-xl)' }}>{listing.views || 0}</div></div>
              <div className="stat"><div className="stat-label">Enquiries</div><div className="stat-value" style={{ fontSize: 'var(--fs-xl)' }}>{listing.enquiryCount || 0}</div></div>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="panel-title">Vehicle</h2>
            <dl className="stack gap-3">
              {details.map(([k, v]) => (
                <div key={k} className="row between gap-4 text-sm">
                  <dt className="muted">{k}</dt>
                  <dd style={{ textTransform: 'capitalize', textAlign: 'right', color: v ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{v || 'Not set'}</dd>
                </div>
              ))}
            </dl>
            <div className="divider" />
            <div className="text-xs muted">Listed {fmtDate(listing.createdAt)} · Updated {fmtDate(listing.updatedAt)}</div>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDel}
        danger
        busy={acting === 'delete'}
        title="Delete this listing permanently?"
        body="This deletes the listing and all its photos from Cloudinary. It can't be undone."
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </AdminLayout>
  );
}
