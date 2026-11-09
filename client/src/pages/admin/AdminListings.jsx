import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PageHeader, TableSkeleton, EmptyState } from '../../components/DashboardShell';
import { fmtPrice } from '../../components/CarCard';
import axiosInstance from '../../api/axiosInstance';
import { getPlaceholder } from '../../utils/placeholder';

const PLACEHOLDER = getPlaceholder(72, 52);
const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'false' },
  { label: 'Approved', value: 'true' },
];
const LIMIT = 20;

const statusBadge = (l) => {
  if (l.isApproved && l.isActive) return <span className="badge badge-success">Live</span>;
  if (!l.isApproved && l.isActive) return <span className="badge badge-warning">Pending</span>;
  return <span className="badge badge-error">Rejected</span>;
};

export default function AdminListings() {
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState(params.get('approved') || '');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [acting, setActing] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async (p, f, s) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: p, limit: LIMIT });
      if (f !== '') q.set('approved', f);
      if (s) q.set('search', s);
      const { data } = await axiosInstance.get(`/admin/listings?${q}`);
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Listings could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, filter, query); }, [page, filter, query, load]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onSearch = (val) => {
    setSearch(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); setQuery(val); }, 400);
  };

  const changeFilter = (v) => {
    setFilter(v);
    setPage(1);
    setParams(v ? { approved: v } : {}, { replace: true });
  };

  const act = async (id, endpoint, successMsg, update) => {
    setActing((p) => ({ ...p, [id]: endpoint }));
    try {
      await axiosInstance.put(`/admin/listings/${id}/${endpoint}`);
      setListings((prev) => prev.map((l) => (l._id === id ? { ...l, ...update } : l)));
      toast.success(successMsg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActing((p) => ({ ...p, [id]: null }));
    }
  };

  const confirmDelete = async () => {
    const id = toDelete._id;
    setActing((p) => ({ ...p, [id]: 'delete' }));
    try {
      await axiosInstance.delete(`/admin/listings/${id}`);
      setListings((prev) => prev.filter((l) => l._id !== id));
      setTotal((t) => t - 1);
      toast.success('Listing permanently deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setActing((p) => ({ ...p, [id]: null }));
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Listings" subtitle={loading ? 'Loading…' : `${total} ${total === 1 ? 'listing' : 'listings'}`} />

      <div className="row wrap between gap-3 mb-4">
        <div className="seg" role="tablist" aria-label="Filter listings">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" role="tab" aria-selected={filter === f.value} className={filter === f.value ? 'is-active' : ''} onClick={() => changeFilter(f.value)}>{f.label}</button>
          ))}
        </div>
        <div className="input-icon" style={{ width: 300, maxWidth: '100%' }}>
          <Icon name="search" />
          <label htmlFor="l-search" className="sr-only">Search listings</label>
          <input id="l-search" type="search" className="input" placeholder="Search title, make or model" value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {loading ? <TableSkeleton rows={8} cols={5} /> : listings.length === 0 ? (
          <EmptyState icon="car" title="No listings found">{query ? `Nothing matches "${query}".` : 'No listings match this filter.'}</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Listing</th>
                  <th scope="col">Dealer</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col">Views</th>
                  <th scope="col">Listed</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <Link to={`/admin/listings/${l._id}`} className="row gap-3" style={{ color: 'inherit' }}>
                        <img src={l.images?.[0] || PLACEHOLDER} alt="" loading="lazy" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)', flexShrink: 0 }} onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
                        <div style={{ minWidth: 0 }}>
                          <div className="strong truncate" style={{ maxWidth: 240 }}>{l.title}</div>
                          <div className="text-xs muted" style={{ textTransform: 'capitalize' }}>{[l.condition, l.region].filter(Boolean).join(' · ')}</div>
                        </div>
                      </Link>
                    </td>
                    <td>{l.dealer?.businessName || 'Unknown'}</td>
                    <td className="strong" style={{ whiteSpace: 'nowrap' }}>{fmtPrice(l.price, l.currency)}</td>
                    <td>{statusBadge(l)}</td>
                    <td>{l.views || 0}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                    <td>
                      <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                        {!l.isApproved ? (
                          <button type="button" className="btn btn-success btn-sm" disabled={!!acting[l._id]} onClick={() => act(l._id, 'approve', 'Listing approved', { isApproved: true, isActive: true })}>
                            {acting[l._id] === 'approve' ? <span className="spinner" /> : 'Approve'}
                          </button>
                        ) : (
                          <button type="button" className="btn btn-secondary btn-sm" disabled={!!acting[l._id]} onClick={() => act(l._id, 'reject', 'Listing rejected', { isApproved: false, isActive: false })}>
                            {acting[l._id] === 'reject' ? <span className="spinner" /> : 'Reject'}
                          </button>
                        )}
                        <button type="button" className="btn btn-danger btn-sm" disabled={!!acting[l._id]} onClick={() => setToDelete(l)} aria-label={`Delete ${l.title}`}>
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
        busy={toDelete ? acting[toDelete._id] === 'delete' : false}
        title="Delete this listing permanently?"
        body="This deletes the listing and all its photos from Cloudinary. It can't be undone."
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </AdminLayout>
  );
}
