import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import Pagination from '../../components/Pagination';
import { PageHeader, StatusBadge, TableSkeleton, EmptyState } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';
import { ENQUIRY_TYPE_LABEL, enquirySender } from '../../utils/enquiries';

const LIMIT = 20;
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
];
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const status = filter ? `&status=${filter}` : '';
    axiosInstance.get(`/admin/enquiries?page=${page}&limit=${LIMIT}${status}`)
      .then(({ data }) => { setEnquiries(data.enquiries || []); setTotal(data.total || 0); })
      .catch(() => toast.error('Enquiries could not be loaded'))
      .finally(() => setLoading(false));
  }, [page, filter]);

  const changeFilter = (f) => { setFilter(f); setPage(1); };

  return (
    <AdminLayout>
      <PageHeader title="Enquiries" subtitle={loading ? 'Loading…' : `${total} ${total === 1 ? 'enquiry' : 'enquiries'}`} />

      <div className="seg mb-4" role="tablist" aria-label="Filter enquiries">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" role="tab" aria-selected={filter === f.value} className={filter === f.value ? 'is-active' : ''} onClick={() => changeFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      <div className="card">
        {loading ? <TableSkeleton rows={6} cols={5} /> : enquiries.length === 0 ? (
          <EmptyState icon="message" title="No enquiries">Buyer enquiries to dealers appear here.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table table-stack">
              <thead>
                <tr>
                  <th scope="col">Listing</th>
                  <th scope="col">Dealer</th>
                  <th scope="col">From</th>
                  <th scope="col">Message</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((e) => {
                  const s = enquirySender(e);
                  return (
                    <tr key={e._id}>
                      <td data-label="Listing" className="cell-main">
                        {e.listing?._id
                          ? <Link to={`/admin/listings/${e.listing._id}`} className="strong" style={{ color: 'var(--color-text)' }}>{e.listing.title}</Link>
                          : <span className="strong">Removed listing</span>}
                        <div className="text-xs muted">{ENQUIRY_TYPE_LABEL[e.type] || e.type}</div>
                      </td>
                      <td data-label="Dealer">
                        {e.dealer?._id
                          ? <Link to={`/admin/dealers/${e.dealer._id}`}>{e.dealer.businessName}</Link>
                          : 'Unknown'}
                      </td>
                      <td data-label="From">
                        {s.name}{s.isGuest && <span className="muted"> (guest)</span>}
                        {s.email && <div className="text-xs muted">{s.email}</div>}
                      </td>
                      <td data-label="Message" style={{ maxWidth: 320 }}>
                        <span className="text-sm" title={e.message} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.message}</span>
                      </td>
                      <td data-label="Date" style={{ whiteSpace: 'nowrap' }}>{fmtDate(e.createdAt)}</td>
                      <td data-label="Status"><StatusBadge status={e.status} /></td>
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
