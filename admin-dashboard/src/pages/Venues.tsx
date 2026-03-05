import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonCards } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { Badge } from '../components/Badge';
import { theme } from '../theme';

export default function Venues() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.listVenues()
      .then(r => { setVenues(r.data); setError(null); })
      .catch(() => setError('Failed to load venues.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading && venues.length === 0) return <SkeletonCards count={5} />;

  return (
    <div role="main" aria-label="Venues management">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[6],
      }} id="venues-title">
        Venues ({venues.length})
      </h2>
      <div style={{ display: 'grid', gap: theme.space[4] }}>
        {venues.map(v => (
          <GlassCard key={v.id} hover>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.space[3] }}>
              <div>
                <div style={{
                  fontFamily: theme.font.display,
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.semibold,
                  color: theme.colors.text,
                }}>{v.name}</div>
                <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: theme.space[1] }}>
                  {v.tagline || v.type} · {v.price_range || '$$'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: theme.space[2] }}>
                <Badge variant={v.is_claimed ? 'success' : 'neutral'}>{v.is_claimed ? 'Claimed' : 'Unclaimed'}</Badge>
                {v.venue_tier && <Badge variant="primary">{v.venue_tier}</Badge>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: theme.space[6], marginTop: theme.space[3] }}>
              <div>
                <span style={{ color: theme.colors.success, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.lg }}>{v.current_checkins}</span>
                <span style={{ color: theme.colors.textDim, fontSize: theme.fontSize.xs, marginLeft: theme.space[1] }}>checked in</span>
              </div>
              <div>
                <span style={{ color: theme.colors.info, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.lg }}>{v.upcoming_events}</span>
                <span style={{ color: theme.colors.textDim, fontSize: theme.fontSize.xs, marginLeft: theme.space[1] }}>events</span>
              </div>
              <div>
                <span style={{ color: theme.colors.warning, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.lg }}>{v.active_ads}</span>
                <span style={{ color: theme.colors.textDim, fontSize: theme.fontSize.xs, marginLeft: theme.space[1] }}>active ads</span>
              </div>
              <div>
                <span style={{ color: theme.colors.accentPink, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.lg }}>{v.avg_rating ? parseFloat(v.avg_rating).toFixed(1) : '—'}</span>
                <span style={{ color: theme.colors.textDim, fontSize: theme.fontSize.xs, marginLeft: theme.space[1] }}>rating</span>
              </div>
            </div>
            {v.description && (
              <div style={{ color: theme.colors.textDim, fontSize: theme.fontSize.sm, marginTop: theme.space[3] }}>
                {v.description.substring(0, 120)}...
              </div>
            )}
          </GlassCard>
        ))}
        {venues.length === 0 && (
          <GlassCard>
            <div style={{ color: theme.colors.textMuted, textAlign: 'center', padding: theme.space[8] }}>No venues yet</div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
