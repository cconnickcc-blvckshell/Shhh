import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonTable } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { Badge } from '../components/Badge';
import { theme } from '../theme';

interface LogEntry {
  id: string;
  display_name: string;
  action: string;
  gdpr_category: string;
  created_at: string;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.getAuditLogs(100)
      .then(r => { setLogs(r.data as LogEntry[]); setError(null); })
      .catch(() => setError('Failed to load audit log.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading && logs.length === 0) return <SkeletonTable rows={10} />;

  return (
    <div role="main" aria-label="Audit log">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[6],
      }} id="audit-title">
        Audit Log
      </h2>
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} role="grid" aria-label="Audit log entries">
          <thead>
            <tr style={{ borderBottom: theme.glass.border }}>
              {['Time', 'User', 'Action', 'Category'].map(h => (
                <th key={h} scope="col" style={{
                  padding: theme.space[4],
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
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{new Date(log.created_at).toLocaleString()}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.text, fontSize: theme.fontSize.sm }}>{log.display_name || '—'}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.info, fontSize: theme.fontSize.sm, fontFamily: theme.font.mono }}>{log.action}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}` }}>
                  <Badge variant="primary">{log.gdpr_category || '—'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
