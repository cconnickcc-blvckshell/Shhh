import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonCards } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { Badge } from '../components/Badge';
import { theme } from '../theme';

const phaseColors: Record<string, string> = {
  discovery: theme.colors.info,
  upcoming: theme.colors.accent,
  live: theme.colors.success,
  winding_down: theme.colors.warning,
  post: theme.colors.textMuted,
  archived: theme.colors.textDim,
};

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.listEvents()
      .then(r => { setEvents(r.data); setError(null); })
      .catch(() => setError('Failed to load events.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading && events.length === 0) return <SkeletonCards count={5} />;

  return (
    <div role="main" aria-label="Events management">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[6],
      }} id="events-title">
        Events ({events.length})
      </h2>
      <div style={{ display: 'grid', gap: theme.space[3] }}>
        {events.map(e => {
          const phaseColor = phaseColors[e.phase || e.status] || theme.colors.textDim;
          return (
            <GlassCard key={e.id} accent={phaseColor} hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.space[2] }}>
                <div>
                  <div style={{
                    fontFamily: theme.font.display,
                    fontSize: theme.fontSize.base,
                    fontWeight: theme.fontWeight.semibold,
                    color: theme.colors.text,
                  }}>{e.title}</div>
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: theme.space[1] }}>
                    {e.venue_name || 'No venue'} · Hosted by {e.host_name}
                  </div>
                </div>
                <Badge variant="primary" style={{ background: `${phaseColor}20`, color: phaseColor }}>
                  {e.phase || e.status}
                </Badge>
              </div>
              <div style={{ display: 'flex', gap: theme.space[5], color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
                <span>📅 {new Date(e.starts_at).toLocaleDateString()}</span>
                <span>👥 {e.going_count || 0} going</span>
                <span>✅ {e.checked_in_count || 0} checked in</span>
                <span>🏠 Capacity: {e.capacity || '∞'}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
