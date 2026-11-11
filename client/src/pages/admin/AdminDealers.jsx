import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PageHeader, TableSkeleton, EmptyState } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'false' },
  { label: 'Approved', value: 'true' },
];
const TIER_BADGE = { basic: '', pro: 'badge-red', premium: 'badge-solid' };
const LIMIT = 20;

export default function AdminDealers() {
  const [params, setParams] = useSearchParams();
  const [dealers, setDealers] = useState([]);
  // Honour ?approved= so the dashboard's "View all" links land on the right tab
  const [filter, setFilter] = useState(params.get('approved') || '');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [acting, setActing] = useState({});
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async (p, f) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: p, limit: LIMIT });
      if (f !== '') q.set('approved', f);
      const { data } = await axiosInstance.get(`/admin/dealers?${q}`);
      setDealers(data.dealers || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Dealers could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, filter); }, [page, filter, load]);

  const changeFilter = (v) => {
    setFilter(v);
    setPage(1);
    setParams(v ? { approved: v } : {}, { replace: true });
  };

  const act = async (id, endpoint, successMsg, update) => {
    setActing((p) => ({ ...p, [id]: endpoint }));
    try {
      await axiosInstance.put(`/admin/dealers/${id}/${endpoint}`);
      setDealers((prev) => prev.map((d) => (d._id === id ? { ...d, ...update } : d)));
      toast.success(successMsg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActing((p) => ({ ...p, [id]: null }));
      setConfirm(null);
    }
  };

  const busy = (d, ep) => acting[d._id] === ep;

  return (
    <AdminLayout>
      <PageHeader title="Dealers" subtitle={loading ? 'Loading…' : `${total} ${total === 1 ? 'dealer' : 'dealers'}`} />

      <div className="row wrap between gap-3 mb-4">
        <div className="seg" role="tablist" aria-label="Filter dealers">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" role="tab" aria-selected={filter === f.value} className={filter === f.value ? 'is-active' : ''} onClick={() => changeFilter(f.value)}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? <TableSkeleton rows={6} cols={5} /> : dealers.length === 0 ? (
          <EmptyState icon="store" title="No dealers here">{filter === 'false' ? 'Nobody is waiting for approval.' : 'No dealers match this filter.'}</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table table-stack">
              <thead>
                <tr>
                  <th scope="col">Dealer</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Region</th>
                  <th scope="col">Plan</th>
                  <th scope="col">Status</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dealers.map((d) => (
                  <tr key={d._id}>
                    <td data-label="Dealer" className="cell-main">
                      <Link to={`/admin/dealers/${d._id}`} className="row gap-3" style={{ color: 'inherit' }}>
                        {d.logo
                          ? <img src={d.logo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                          : <span className="avatar" style={{ width: 36, height: 36 }}>{d.businessName?.[0]}</span>}
                        <div style={{ minWidth: 0 }}>
                          <div className="strong truncate" style={{ maxWidth: 220 }}>{d.businessName}</div>
                          {d.businessAddress && <div className="text-xs muted truncate" style={{ maxWidth: 220 }}>{d.businessAddress}</div>}
                        </div>
                      </Link>
                    </td>
                    <td data-label="Owner">
                      <div>{d.user?.name}</div>
                      <div className="text-xs muted">{d.user?.email}</div>
                    </td>
                    <td data-label="Region">{d.region}</td>
                    <td data-label="Plan"><span className={`badge ${TIER_BADGE[d.subscriptionTier || 'basic']}`} style={{ textTransform: 'capitalize' }}>{d.subscriptionTier || 'basic'}</span></td>
                    <td data-label="Status">
                      <div className="row wrap gap-1">
                        <span className={`badge ${d.isApproved ? 'badge-success' : 'badge-warning'}`}>{d.isApproved ? 'Approved' : 'Pending'}</span>
                        {d.isVerified && <span className="badge badge-red"><Icon name="checkCircle" /> Verified</span>}
                      </div>
                    </td>
                    <td data-label="Actions" className="cell-actions">
                      <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                        {!d.isApproved && (
                          <button type="button" className="btn btn-success btn-sm" disabled={!!acting[d._id]} onClick={() => act(d._id, 'approve', 'Dealer approved', { isApproved: true })}>
                            {busy(d, 'approve') ? <span className="spinner" /> : 'Approve'}
                          </button>
                        )}
                        {!d.isVerified && (
                          <button type="button" className="btn btn-secondary btn-sm" disabled={!!acting[d._id]} onClick={() => act(d._id, 'verify', 'Dealer verified', { isVerified: true })}>
                            {busy(d, 'verify') ? <span className="spinner" /> : 'Verify'}
                          </button>
                        )}
                        {d.isApproved ? (
                          <button type="button" className="btn btn-danger btn-sm" disabled={!!acting[d._id]} onClick={() => setConfirm({ d, ep: 'suspend', title: 'Suspend this dealer?', msg: 'Dealer suspended', label: 'Suspend' })}>Suspend</button>
                        ) : (
                          <button type="button" className="btn btn-danger btn-sm" disabled={!!acting[d._id]} onClick={() => setConfirm({ d, ep: 'reject', title: 'Reject this dealer?', msg: 'Dealer rejected', label: 'Reject' })}>Reject</button>
                        )}
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
        open={!!confirm}
        danger
        busy={confirm ? !!acting[confirm.d._id] : false}
        title={confirm?.title}
        body={confirm ? `${confirm.d.businessName}'s listings will stop showing to buyers.` : ''}
        confirmLabel={confirm?.label}
        onConfirm={() => act(confirm.d._id, confirm.ep, confirm.msg, { isApproved: false })}
        onCancel={() => setConfirm(null)}
      />
    </AdminLayout>
  );
}
