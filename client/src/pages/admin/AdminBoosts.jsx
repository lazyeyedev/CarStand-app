import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import Pagination from '../../components/Pagination';
import { PageHeader, StatusBadge, TableSkeleton, EmptyState } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';

const TYPE_BADGE = { featured: 'badge-red', top: 'badge-info', banner: 'badge-warning' };
const LIMIT = 20;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminBoosts() {
  const [boosts, setBoosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(`/admin/boosts?page=${page}&limit=${LIMIT}`)
      .then(({ data }) => { setBoosts(data.boosts || []); setTotal(data.total || 0); })
      .catch(() => toast.error('Boosts could not be loaded'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <AdminLayout>
      <PageHeader title="Boosts" subtitle={loading ? 'Loading…' : `${total} ${total === 1 ? 'boost' : 'boosts'}`} />

      <div className="card">
        {loading ? <TableSkeleton rows={6} cols={6} /> : boosts.length === 0 ? (
          <EmptyState icon="zap" title="No boosts yet">Paid boosts appear here once a dealer features a listing.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Listing</th>
                  <th scope="col">Dealer</th>
                  <th scope="col">Type</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Amount</th>
                  <th scope="col">Runs</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {boosts.map((b) => {
                  const status = new Date(b.endDate) < new Date() ? 'expired' : b.status;
                  return (
                    <tr key={b._id}>
                      <td>
                        {b.listing?._id
                          ? <Link to={`/admin/listings/${b.listing._id}`} className="strong" style={{ color: 'var(--color-text)' }}>{b.listing.title}</Link>
                          : <span className="strong">{b.listing?.title || 'Removed listing'}</span>}
                        <div className="text-xs muted">{[b.listing?.year, b.listing?.make, b.listing?.model].filter(Boolean).join(' ')}</div>
                      </td>
                      <td>{b.dealer?.businessName || 'Unknown'}</td>
                      <td><span className={`badge ${TYPE_BADGE[b.boostType] ?? ''}`} style={{ textTransform: 'capitalize' }}>{b.boostType}</span></td>
                      <td className="strong" style={{ textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>GHS {Number(b.amountPaid || 0).toLocaleString()}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(b.startDate)} to {fmtDate(b.endDate)}</td>
                      <td><StatusBadge status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onChange={setPage} />}
    </AdminLayout>
  );
}
