import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonTable } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { Badge } from '../components/Badge';
import { theme } from '../theme';

export default function Ads() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.listAds()
      .then(r => { setAds(r.data); setError(null); })
      .catch(() => setError('Failed to load ad placements.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading && ads.length === 0) return <SkeletonTable rows={5} />;

  return (
    <div role="main" aria-label="Ad placements">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[6],
      }} id="ads-title">
        Ad Placements
      </h2>
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: theme.glass.border }}>
              {['Venue', 'Surface', 'Headline', 'Impressions', 'Taps', 'CTR', 'Spent', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
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
            {ads.map(ad => (
              <tr key={ad.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.text, fontSize: theme.fontSize.sm }}>{ad.venue_name || '—'}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}` }}>
                  <Badge variant="info">{ad.surface}</Badge>
                </td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>{ad.headline}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.text, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm }}>{ad.impression_count}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.primary, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm }}>{ad.tap_count}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.warning, fontSize: theme.fontSize.sm }}>{ad.ctr_percent}%</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.success, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm }}>${ad.spent_dollars}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}` }}>
                  <Badge variant={ad.is_active ? 'success' : 'danger'}>{ad.is_active ? 'Active' : 'Paused'}</Badge>
                </td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}` }}>
                  <GlassButton
                    variant={ad.is_active ? 'danger' : 'success'}
                    onClick={() => adminApi.toggleAd(ad.id, !ad.is_active).then(load)}
                    style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: theme.fontSize.xs }}
                  >
                    {ad.is_active ? 'Pause' : 'Activate'}
                  </GlassButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
