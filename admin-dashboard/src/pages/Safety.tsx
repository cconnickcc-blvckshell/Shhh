import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonCards } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme';

export default function Safety() {
  const [alerts, setAlerts] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    adminApi.getSafetyAlerts()
      .then(r => { setAlerts(r.data); setError(null); })
      .catch(() => setError('Failed to load safety alerts.'));
  };

  useEffect(load, []);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (!alerts) return <SkeletonCards count={3} />;

  return (
    <div role="main" aria-label="Safety center">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[6],
      }} id="safety-title">
        Safety Center
      </h2>

      <div style={{ marginBottom: theme.space[6] }}>
        <h3 style={{ color: theme.colors.danger, fontSize: theme.fontSize.sm, marginBottom: theme.space[3], fontWeight: theme.fontWeight.semibold }}>Panic Alerts (24h)</h3>
        {alerts.panicAlerts.length === 0 ? (
          <GlassCard accent={theme.colors.success}>
            <div style={{ color: theme.colors.success, fontSize: theme.fontSize.sm }}>No panic alerts in the last 24 hours ✓</div>
          </GlassCard>
        ) : alerts.panicAlerts.map((a: any) => (
          <GlassCard key={a.id} accent={theme.colors.danger} style={{ marginBottom: theme.space[2] }}>
            <div style={{ color: theme.colors.text, fontWeight: theme.fontWeight.semibold }}>{a.display_name}</div>
            <div style={{ color: theme.colors.danger, fontSize: theme.fontSize.sm, marginTop: theme.space[1] }}>{new Date(a.created_at).toLocaleString()}</div>
          </GlassCard>
        ))}
      </div>

      <div style={{ marginBottom: theme.space[6] }}>
        <h3 style={{ color: theme.colors.warning, fontSize: theme.fontSize.sm, marginBottom: theme.space[3], fontWeight: theme.fontWeight.semibold }}>Missed Check-ins</h3>
        {alerts.missedCheckins.length === 0 ? (
          <GlassCard accent={theme.colors.success}>
            <div style={{ color: theme.colors.success, fontSize: theme.fontSize.sm }}>No missed check-ins ✓</div>
          </GlassCard>
        ) : alerts.missedCheckins.map((c: any) => (
          <GlassCard key={c.id} accent={theme.colors.warning} style={{ marginBottom: theme.space[2] }}>
            <div style={{ color: theme.colors.text, fontWeight: theme.fontWeight.semibold }}>{c.display_name}</div>
            <div style={{ color: theme.colors.warning, fontSize: theme.fontSize.sm }}>Expected: {new Date(c.expected_next_at).toLocaleString()}</div>
          </GlassCard>
        ))}
      </div>

      <div>
        <h3 style={{ color: theme.colors.accentPink, fontSize: theme.fontSize.sm, marginBottom: theme.space[3], fontWeight: theme.fontWeight.semibold }}>Pending Reports ({alerts.pendingReports.length})</h3>
        {alerts.pendingReports.map((r: any) => (
          <GlassCard key={r.id} style={{ marginBottom: theme.space[2] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.space[2] }}>
              <span style={{ color: theme.colors.danger, fontWeight: theme.fontWeight.semibold }}>{r.reason}</span>
              <span style={{ color: theme.colors.textDim, fontSize: theme.fontSize.xs }}>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginBottom: theme.space[2] }}>
              <strong>{r.reporter_name}</strong> reported <strong>{r.reported_name}</strong>
            </div>
            <div style={{ display: 'flex', gap: theme.space[2] }}>
              <GlassButton variant="danger" onClick={() => adminApi.resolveReport(r.id, 'resolved')}>Resolve</GlassButton>
              <GlassButton variant="secondary" onClick={() => adminApi.resolveReport(r.id, 'dismissed')}>Dismiss</GlassButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
