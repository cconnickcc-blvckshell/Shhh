import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminLoading, AdminError } from '../components/AdminPageState';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = search
        ? await adminApi.searchUsers(search, page)
        : await adminApi.listUsers(page, filter || undefined);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading && users.length === 0) return <AdminLoading />;

  const filters = ['', 'active', 'banned', 'verified', 'hosts', 'admins'];

  return (
    <div role="main" aria-label="Users management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#fff', margin: 0 }} id="users-title">Users ({total})</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #333', background: '#1a1a2e', color: '#fff', width: 240 }} />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#9333EA', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Search</button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: filter === f ? '#9333EA' : '#1a1a2e', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} role="grid" aria-label="Users table">
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              {['Name', 'Gender', 'Status', 'Tier', 'Role', 'Trust', 'Reports', 'Presence', 'Joined', 'Actions'].map(h => (
                <th key={h} scope="col" style={{ padding: '10px 12px', textAlign: 'left', color: '#888', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '10px 12px', color: '#fff', fontSize: 13, fontWeight: 600 }}>{u.display_name}</td>
                <td style={{ padding: '10px 12px', color: '#aaa', fontSize: 12 }}>{u.gender || '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: u.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', color: u.is_active ? '#34D399' : '#EF4444' }}>
                    {u.is_active ? 'Active' : 'Banned'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: '#A855F7', fontSize: 12, fontWeight: 600 }}>T{u.verification_tier}</td>
                <td style={{ padding: '10px 12px', color: u.role !== 'user' ? '#FBBF24' : '#555', fontSize: 12 }}>{u.role}</td>
                <td style={{ padding: '10px 12px', color: '#aaa', fontSize: 12 }}>{u.trust_score ? `${u.trust_score} (${u.trust_badge})` : '—'}</td>
                <td style={{ padding: '10px 12px', color: u.report_count > 0 ? '#EF4444' : '#555', fontSize: 12 }}>{u.report_count}</td>
                <td style={{ padding: '10px 12px' }}>
                  {u.presence_state && <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>{u.presence_state}</span>}
                </td>
                <td style={{ padding: '10px 12px', color: '#666', fontSize: 11 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => adminApi.toggleUserActive(u.id, !u.is_active).then(load)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: u.is_active ? '#DC2626' : '#34D399', color: '#fff', cursor: 'pointer', fontSize: 10 }}>
                      {u.is_active ? 'Ban' : 'Unban'}
                    </button>
                    <select onChange={e => adminApi.setUserRole(u.id, e.target.value).then(load)} value={u.role} style={{ padding: '4px', borderRadius: 6, border: '1px solid #333', background: '#16213e', color: '#fff', fontSize: 10 }}>
                      <option value="user">user</option>
                      <option value="moderator">mod</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#1a1a2e', color: '#fff', cursor: 'pointer' }}>← Prev</button>
        <span style={{ color: '#888', alignSelf: 'center', fontSize: 12 }}>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#1a1a2e', color: '#fff', cursor: 'pointer' }}>Next →</button>
      </div>
    </div>
  );
}
