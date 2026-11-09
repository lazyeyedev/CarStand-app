import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import DealerLayout from './DealerLayout';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PageHeader, TableSkeleton, EmptyState } from '../../components/DashboardShell';
import { fmtPrice } from '../../components/CarCard';
import axiosInstance from '../../api/axiosInstance';
import { getPlaceholder } from '../../utils/placeholder';

const PLACEHOLDER = getPlaceholder(80, 56);
const LIMIT = 20;

const statusOf = (l) => {
  if (!l.isActive) return <span className="badge badge-error">Inactive</span>;
  if (!l.isApproved) return <span className="badge badge-warning">Pending review</span>;
  return <span className="badge badge-success">Live</span>;
};

export default function DealerListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/listings/dealer/mine?page=${p}&limit=${LIMIT}`);
      setListings(data.listings);
      setTotal(data.total);
    } catch {
      toast.error('Your listings could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await axiosInstance.delete(`/listings/${toDelete._id}`);
      toast.success('Listing removed');
      setToDelete(null);
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'The listing could not be removed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DealerLayout>
      <PageHeader
        title="My listings"
        subtitle={loading ? 'Loading…' : `${total} ${total === 1 ? 'listing' : 'listings'}`}
        actions={<Link to="/dealer/listings/create" className="btn btn-primary"><Icon name="plus" /> Add a listing</Link>}
      />

      <div className="card">
        {loading ? <TableSkeleton rows={5} cols={5} /> : listings.length === 0 ? (
          <EmptyState icon="car" title="No listings yet" action={<Link to="/dealer/listings/create" className="btn btn-primary"><Icon name="plus" /> Create your first listing</Link>}>
            Add a car with photos, price and details. It goes live once it's reviewed.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col">Views</th>
                  <th scope="col">Enquiries</th>
                  <th scope="col">Listed</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <div className="row gap-3">
                        <img src={l.images?.[0] || PLACEHOLDER} alt="" width="72" height="50" loading="lazy"
                          style={{ width: 72, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)', flexShrink: 0 }}
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
                        <div style={{ minWidth: 0 }}>
                          <Link to={`/listings/${l._id}`} className="strong truncate" style={{ display: 'block', maxWidth: 240, color: 'var(--color-text)' }}>{l.title}</Link>
                          <div className="text-xs muted mt-2" style={{ textTransform: 'capitalize' }}>{[l.condition, l.bodyType].filter(Boolean).join(' · ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="strong" style={{ whiteSpace: 'nowrap', color: 'var(--red-text)' }}>{fmtPrice(l.price, l.currency)}</td>
                    <td>{statusOf(l)}</td>
                    <td>{l.views || 0}</td>
                    <td>{l.enquiryCount || 0}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                        <Link to={`/dealer/listings/edit/${l._id}`} className="btn btn-secondary btn-sm"><Icon name="edit" /> Edit</Link>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(l)} aria-label={`Remove ${l.title}`}>
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onChange={setPage} />}

      <ConfirmDialog
        open={!!toDelete}
        danger
        busy={deleting}
        title="Remove this listing?"
        body={toDelete ? `"${toDelete.title}" will be taken off the marketplace. Buyers will no longer see it.` : ''}
        confirmLabel="Remove listing"
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </DealerLayout>
  );
}
