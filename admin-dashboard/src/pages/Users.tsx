import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonTable } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { Badge } from '../components/Badge';
import { theme } from '../theme';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

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

  const handleToggleActive = (u: any) => {
    adminApi.toggleUserActive(u.id, !u.is_active)
      .then(() => { load(); showSuccess(u.is_active ? 'User banned.' : 'User unbanned.'); })
      .catch(() => setError('Failed to update user.'));
  };

  const handleRoleChange = (u: any, role: string) => {
    adminApi.setUserRole(u.id, role)
      .then(() => { load(); showSuccess(`Role set to ${role}.`); })
      .catch(() => setError('Failed to update role. Admin only.'));
  };

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading && users.length === 0) return <SkeletonTable rows={10} />;

  const filters = ['', 'active', 'banned', 'verified', 'hosts', 'admins'];

  return (
    <div role="main" aria-label="Users management">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.space[5],
        flexWrap: 'wrap',
        gap: theme.space[4],
      }}>
        <h2 style={{
          fontFamily: theme.font.display,
          fontSize: theme.fontSize.xl,
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.text,
          margin: 0,
        }} id="users-title">
          Users ({total})
        </h2>
        {successMessage && (
          <div style={{
            position: 'fixed',
            top: theme.space[4],
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme.colors.successMuted || 'rgba(52, 211, 153, 0.2)',
            border: `1px solid ${theme.colors.success || '#34D399'}`,
            borderRadius: theme.radius.md,
            padding: `${theme.space[2]} ${theme.space[4]}`,
            color: theme.colors.success || '#34D399',
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            zIndex: 1000,
            boxShadow: theme.glass.shadow,
          }}>
            {successMessage}
          </div>
        )}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: theme.space[2] }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            style={{
              padding: `${theme.space[2]} ${theme.space[3]}`,
              borderRadius: theme.radius.md,
              border: theme.glass.border,
              background: 'rgba(255,255,255,0.04)',
              color: theme.colors.text,
              width: 260,
              fontSize: theme.fontSize.sm,
              fontFamily: theme.font.body,
            }}
          />
          <GlassButton type="submit" variant="primary">Search</GlassButton>
        </form>
      </div>

      <div style={{ display: 'flex', gap: theme.space[2], marginBottom: theme.space[4] }}>
        {filters.map(f => (
          <GlassButton
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            onClick={() => { setFilter(f); setPage(1); }}
          >
            {f || 'All'}
          </GlassButton>
        ))}
      </div>

      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} role="grid" aria-label="Users table">
          <thead>
            <tr style={{ borderBottom: theme.glass.border }}>
              {['Name', 'Gender', 'Status', 'Tier', 'Role', 'Trust', 'Reports', 'Presence', 'Joined', 'Actions'].map(h => (
                <th key={h} scope="col" style={{
                  padding: `${theme.space[3]} ${theme.space[4]}`,
                  textAlign: 'left',
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: theme.fontWeight.semibold,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold }}>{u.display_name}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>{u.gender || '—'}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}` }}>
                  <Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Active' : 'Banned'}</Badge>
                </td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold }}>T{u.verification_tier}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: u.role !== 'user' ? theme.colors.warning : theme.colors.textDim, fontSize: theme.fontSize.sm }}>{u.role}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>{u.trust_score ? `${u.trust_score} (${u.trust_badge})` : '—'}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: u.report_count > 0 ? theme.colors.danger : theme.colors.textDim, fontSize: theme.fontSize.sm }}>{u.report_count}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}` }}>
                  {u.presence_state && <Badge variant="success">{u.presence_state}</Badge>}
                </td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.textDim, fontSize: theme.fontSize.xs }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}` }}>
                  <div style={{ display: 'flex', gap: theme.space[1] }}>
                    <GlassButton variant={u.is_active ? 'danger' : 'success'} onClick={() => handleToggleActive(u)} style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: theme.fontSize.xs }}>
                      {u.is_active ? 'Ban' : 'Unban'}
                    </GlassButton>
                    <select
                      onChange={e => handleRoleChange(u, e.target.value)}
                      value={u.role}
                      title="Admin only — moderators cannot change roles"
                      aria-label={`Set role for ${u.display_name}`}
                      style={{
                        padding: theme.space[1],
                        borderRadius: theme.radius.sm,
                        border: theme.glass.border,
                        background: theme.colors.primaryMuted,
                        color: theme.colors.text,
                        fontSize: theme.fontSize.xs,
                      }}
                    >
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
      </GlassCard>

      <div style={{ display: 'flex', justifyContent: 'center', gap: theme.space[2], marginTop: theme.space[4] }}>
        <GlassButton variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</GlassButton>
        <span style={{ color: theme.colors.textMuted, alignSelf: 'center', fontSize: theme.fontSize.sm }}>Page {page}</span>
        <GlassButton variant="secondary" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next →</GlassButton>
      </div>
    </div>
  );
}
