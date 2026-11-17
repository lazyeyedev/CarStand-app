import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import DealerLayout from './DealerLayout';
import Icon from '../../components/Icon';
import { PageHeader, StatusBadge, TableSkeleton, EmptyState } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';
import { whatsappLink } from '../../utils/whatsapp';
import { ENQUIRY_TYPE_LABEL, enquirySender } from '../../utils/enquiries';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
];

const fmtDate = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function DealerEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(`/dealers/enquiries${filter ? `?status=${filter}` : ''}`)
      .then(({ data }) => setEnquiries(data.enquiries || []))
      .catch(() => toast.error('Enquiries could not be loaded'))
      .finally(() => setLoading(false));
  }, [filter]);

  const markRead = async (id) => {
    setMarking(id);
    try {
      await axiosInstance.put(`/dealers/enquiries/${id}/read`);
      setEnquiries((list) => (filter === 'new'
        ? list.filter((e) => e._id !== id)
        : list.map((e) => (e._id === id ? { ...e, status: 'read' } : e))));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark the enquiry as read');
    } finally {
      setMarking(null);
    }
  };

  const newCount = enquiries.filter((e) => e.status === 'new').length;

  return (
    <DealerLayout>
      <PageHeader
        title="Enquiries"
        subtitle={loading ? 'Loading…' : `${enquiries.length} ${enquiries.length === 1 ? 'enquiry' : 'enquiries'}${!filter && newCount ? `, ${newCount} new` : ''}`}
      />

      <div className="seg mb-4" role="tablist" aria-label="Filter enquiries">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" role="tab" aria-selected={filter === f.value} className={filter === f.value ? 'is-active' : ''} onClick={() => setFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="card"><TableSkeleton rows={5} cols={3} /></div>
      ) : enquiries.length === 0 ? (
        <div className="card">
          <EmptyState icon="message" title={filter === 'new' ? 'No new enquiries' : 'No enquiries yet'}>
            When a buyer contacts you about a car, it appears here and is emailed to you.
          </EmptyState>
        </div>
      ) : (
        <ul className="stack gap-4" style={{ listStyle: 'none' }}>
          {enquiries.map((e) => {
            const s = enquirySender(e);
            return (
              <li key={e._id} className="card card-pad stack gap-3" style={e.status === 'new' ? { borderLeft: '3px solid var(--red)' } : undefined}>
                <div className="row between wrap gap-3">
                  <div style={{ minWidth: 0 }}>
                    {e.listing?._id
                      ? <Link to={`/listings/${e.listing._id}`} className="strong truncate" style={{ color: 'var(--color-text)', fontWeight: 600 }}>{e.listing.title}</Link>
                      : <span className="strong">Listing removed</span>}
                    <div className="text-xs muted mt-2">{ENQUIRY_TYPE_LABEL[e.type] || e.type} · {fmtDate(e.createdAt)}</div>
                  </div>
                  <StatusBadge status={e.status} />
                </div>

                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{e.message}</p>

                <div className="row between wrap gap-3" style={{ borderTop: '1px solid var(--color-border-soft)', paddingTop: 'var(--sp-3)' }}>
                  <div className="text-sm">
                    <strong>{s.name}</strong>{s.isGuest && <span className="muted"> (guest)</span>}
                    <div className="row wrap gap-3 mt-2 muted">
                      {s.email && <a href={`mailto:${s.email}`} className="row gap-1"><Icon name="mail" size={14} /> {s.email}</a>}
                      {s.phone && <a href={`tel:${s.phone}`} className="row gap-1"><Icon name="phone" size={14} /> {s.phone}</a>}
                    </div>
                  </div>
                  <div className="row wrap gap-2">
                    {s.phone && (
                      <a href={whatsappLink(s.phone)} target="_blank" rel="noreferrer" className="btn btn-success btn-sm"><Icon name="whatsapp" /> WhatsApp</a>
                    )}
                    {e.status === 'new' && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => markRead(e._id)} disabled={marking === e._id}>
                        {marking === e._id ? <span className="spinner" /> : <Icon name="check" />} Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DealerLayout>
  );
}
