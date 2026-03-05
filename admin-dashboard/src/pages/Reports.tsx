import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonCards } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme';

interface Report {
  id: string;
  reporter_name: string;
  reported_name: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.getReports(filter)
      .then(r => { setReports(r.data as Report[]); setError(null); })
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const resolve = async (id: string, status: string) => {
    await adminApi.resolveReport(id, status);
    load();
  };

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading && reports.length === 0) return <SkeletonCards count={4} />;

  const filters = ['pending', 'reviewing', 'resolved', 'dismissed'];

  return (
    <div role="main" aria-label="Content reports">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[5],
      }} id="reports-title">
        Reports
      </h2>
      <div style={{ display: 'flex', gap: theme.space[2], marginBottom: theme.space[4] }}>
        {filters.map(s => (
          <GlassButton
            key={s}
            variant={filter === s ? 'primary' : 'secondary'}
            onClick={() => setFilter(s)}
          >
            {s}
          </GlassButton>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[3] }}>
        {reports.length === 0 && (
          <GlassCard>
            <div style={{ color: theme.colors.textMuted, textAlign: 'center' }}>No reports found.</div>
          </GlassCard>
        )}
        {reports.map(r => (
          <GlassCard key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.space[2] }}>
              <span style={{ color: theme.colors.danger, fontWeight: theme.fontWeight.semibold }}>{r.reason}</span>
              <span style={{ color: theme.colors.textDim, fontSize: theme.fontSize.xs }}>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>
              <strong>{r.reporter_name}</strong> reported <strong>{r.reported_name}</strong>
            </div>
            {r.description && (
              <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: theme.space[2] }}>{r.description}</div>
            )}
            {r.status === 'pending' && (
              <div style={{ display: 'flex', gap: theme.space[2], marginTop: theme.space[3] }}>
                <GlassButton variant="danger" onClick={() => resolve(r.id, 'resolved')}>Resolve</GlassButton>
                <GlassButton variant="secondary" onClick={() => resolve(r.id, 'dismissed')}>Dismiss</GlassButton>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
