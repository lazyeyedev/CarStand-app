import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import { PageHeader, TableSkeleton, EmptyState } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';

const ROLE_BADGE = { admin: 'badge-red', dealer: 'badge-info', user: '' };
const LIMIT = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toggling, setToggling] = useState({});
  const timer = useRef(null);

  const load = useCallback(async (p, s) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (s) params.set('search', s);
      const { data } = await axiosInstance.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Users could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, query); }, [page, query, load]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onSearch = (val) => {
    setSearch(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); setQuery(val); }, 400);
  };

  const toggleStatus = async (id, current) => {
    setToggling((p) => ({ ...p, [id]: true }));
    try {
      const { data } = await axiosInstance.put(`/admin/users/${id}/status`, { isActive: !current });
      setUsers((prev) => prev.map((u) => (u._id === id ? data : u)));
      toast.success(`User ${!current ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setToggling((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Users"
        subtitle={loading ? 'Loading…' : `${total} ${total === 1 ? 'account' : 'accounts'}`}
        actions={(
          <div className="input-icon" style={{ width: 280, maxWidth: '100%' }}>
            <Icon name="search" />
            <label htmlFor="u-search" className="sr-only">Search users</label>
            <input id="u-search" type="search" className="input" placeholder="Search name or email" value={search} onChange={(e) => onSearch(e.target.value)} />
          </div>
        )}
      />

      <div className="card">
        {loading ? <TableSkeleton rows={8} cols={4} /> : users.length === 0 ? (
          <EmptyState icon="users" title={query ? 'No matching users' : 'No users yet'}>{query ? `Nothing matches "${query}".` : null}</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Joined</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Account</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="row gap-3">
                        {u.avatar
                          ? <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          : <span className="avatar">{u.name?.[0]?.toUpperCase()}</span>}
                        <span className="strong">{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] ?? ''}`} style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ textAlign: 'right' }}>
                      {u.role === 'admin' ? <span className="text-xs muted">Protected</span> : (
                        <label className="check" style={{ justifyContent: 'flex-end', minHeight: 36 }}>
                          <span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>{u.isActive ? 'Active' : 'Disabled'}</span>
                          <input
                            type="checkbox"
                            role="switch"
                            checked={!!u.isActive}
                            disabled={toggling[u._id]}
                            onChange={() => toggleStatus(u._id, u.isActive)}
                            aria-label={`${u.isActive ? 'Disable' : 'Enable'} ${u.name}`}
                          />
                        </label>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onChange={setPage} />}
    </AdminLayout>
  );
}
