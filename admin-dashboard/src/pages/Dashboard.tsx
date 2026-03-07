import { useEffect, useState, useRef } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonCards } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { Sparkline } from '../components/Sparkline';
import { theme } from '../theme';

const MAX_HISTORY = 24;

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [trustScores, setTrustScores] = useState<{ bucket_0_20: number; bucket_21_40: number; bucket_41_60: number; bucket_61_80: number; bucket_81_100: number; no_score: number } | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const historyRef = useRef<Record<string, number[]>>({});

  const load = () => {
    setError(null);
    if (!data) setLoading(true);
    adminApi.getOverview()
      .then(r => {
        setData(r.data);
        setError(null);
        const u = r.data?.users || {};
        const s = r.data?.safety || {};
        const c = r.data?.content || {};
        const keys = ['online', 'total', 'panic', 'reports'];
        const vals = [
          c.online_now ?? 0,
          u.total ?? u.total_users ?? 0,
          s.panic_24h ?? 0,
          s.pending_reports ?? 0,
        ];
        keys.forEach((k, i) => {
          const h = historyRef.current[k] || [];
          const next = [...h, vals[i]].slice(-MAX_HISTORY);
          historyRef.current[k] = next;
        });
        setLoading(false);
      })
      .catch(() => {
        adminApi.getStats()
          .then(r => { setData({ users: r.data.users, safety: r.data.reports, revenue: {}, content: {}, system: {} }); setLoading(false); })
          .catch(() => { setError('Failed to load dashboard. Check API connection.'); setLoading(false); });
      });
    adminApi.getHealth().then(setHealth).catch(() => {});
    adminApi.getTrustScoreDistribution().then(r => setTrustScores(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener('command-center-refresh', onRefresh);
    return () => window.removeEventListener('command-center-refresh', onRefresh);
  }, []);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading && !data) return <SkeletonCards count={12} />;

  const u = data?.users || {};
  const r = data?.revenue || {};
  const s = data?.safety || {};
  const c = data?.content || {};

  const cards = [
    { label: 'Online Now', value: c.online_now || 0, color: theme.colors.success, historyKey: 'online' },
    { label: 'Total Users', value: u.total || u.total_users || 0, color: theme.colors.info, historyKey: 'total' },
    { label: 'New (24h)', value: u.new_24h || u.new_today || 0, color: theme.colors.accent },
    { label: 'MRR', value: `$${((r.mrr_cents || 0) / 100).toFixed(0)}`, color: theme.colors.success },
    { label: 'Paying Users', value: r.paying_users || 0, color: theme.colors.primary },
    { label: 'Ad Revenue', value: `$${((r.ad_revenue_cents || 0) / 100).toFixed(0)}`, color: theme.colors.warning },
    { label: 'Panic Alerts', value: s.panic_24h || 0, color: s.panic_24h > 0 ? theme.colors.danger : theme.colors.success, historyKey: 'panic' },
    { label: 'Venue Distress', value: s.venue_distress_24h || 0, color: (s.venue_distress_24h || 0) > 0 ? theme.colors.warning : theme.colors.success },
    { label: 'Pending Reports', value: s.pending_reports || 0, color: s.pending_reports > 0 ? theme.colors.danger : theme.colors.success, historyKey: 'reports' },
    { label: 'Pending Mod', value: s.pending_moderation || 0, color: s.pending_moderation > 0 ? theme.colors.warning : theme.colors.success },
    { label: 'Active Events', value: c.active_events || 0, color: theme.colors.accentPink },
    { label: 'Active Venues', value: c.active_venues || 0, color: theme.colors.accent },
    { label: 'Whispers (24h)', value: c.whispers_24h || 0, color: theme.colors.primary },
  ];

  return (
    <div role="main" aria-label="Command Center">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize['2xl'],
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[6],
      }} id="dashboard-title">
        Command Center
      </h2>

      {/* Tier Funnel: Signup → Verified → Premium */}
      <GlassCard
        accent={theme.colors.primary}
        style={{
          marginBottom: theme.space[6],
          padding: theme.space[4],
        }}
      >
        <div style={{
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.xs,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: theme.fontWeight.semibold,
          marginBottom: theme.space[3],
        }}>
          Tier Funnel
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: theme.space[2],
          flexWrap: 'wrap',
        }}>
          <div style={{
            flex: 1,
            minWidth: 120,
            background: 'rgba(124,43,255,0.15)',
            borderRadius: theme.radius.md,
            padding: theme.space[3],
            borderLeft: `4px solid ${theme.colors.info}`,
          }}>
            <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginBottom: 4 }}>Signups</div>
            <div style={{ fontFamily: theme.font.display, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text }}>
              {u.total ?? u.total_users ?? 0}
            </div>
          </div>
          <div style={{
            flex: 1,
            minWidth: 120,
            background: 'rgba(124,43,255,0.15)',
            borderRadius: theme.radius.md,
            padding: theme.space[3],
            borderLeft: `4px solid ${theme.colors.primary}`,
          }}>
            <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginBottom: 4 }}>Verified</div>
            <div style={{ fontFamily: theme.font.display, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text }}>
              {u.verified ?? u.verified_users ?? 0}
            </div>
          </div>
          <div style={{
            flex: 1,
            minWidth: 120,
            background: 'rgba(124,43,255,0.15)',
            borderRadius: theme.radius.md,
            padding: theme.space[3],
            borderLeft: `4px solid ${theme.colors.success}`,
          }}>
            <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginBottom: 4 }}>Premium</div>
            <div style={{ fontFamily: theme.font.display, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text }}>
              {r.paying_users ?? 0}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Trust Score Distribution */}
      {trustScores && (
        <GlassCard accent={theme.colors.primary} style={{ marginBottom: theme.space[6], padding: theme.space[4] }}>
          <div style={{
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: theme.fontWeight.semibold,
            marginBottom: theme.space[3],
          }}>
            Trust Score Distribution
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
            {[
              { key: '0-20', val: trustScores.bucket_0_20, color: theme.colors.danger },
              { key: '21-40', val: trustScores.bucket_21_40, color: theme.colors.warning },
              { key: '41-60', val: trustScores.bucket_41_60, color: theme.colors.info },
              { key: '61-80', val: trustScores.bucket_61_80, color: theme.colors.primary },
              { key: '81-100', val: trustScores.bucket_81_100, color: theme.colors.success },
              { key: 'N/A', val: trustScores.no_score, color: theme.colors.textMuted },
            ].map(({ key, val, color }) => {
              const max = Math.max(
                trustScores.bucket_0_20, trustScores.bucket_21_40, trustScores.bucket_41_60,
                trustScores.bucket_61_80, trustScores.bucket_81_100, trustScores.no_score, 1
              );
              const h = max > 0 ? Math.max(4, (val / max) * 64) : 0;
              return (
                <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      height: h,
                      backgroundColor: color,
                      borderRadius: 4,
                      opacity: 0.8,
                    }}
                    title={`${key}: ${val}`}
                  />
                  <span style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 4 }}>{key}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: theme.colors.text }}>{val}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <div
        className="dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: theme.space[4],
          marginBottom: theme.space[6],
        }}
      >
        {cards.map(c => {
          const history = (c as any).historyKey ? historyRef.current[(c as any).historyKey] : [];
          return (
            <GlassCard key={c.label} accent={c.color} hover>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: theme.space[2],
              }}>
                <span style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: theme.fontWeight.semibold,
                }}>
                  {c.label}
                </span>
                {history.length >= 2 && (
                  <Sparkline data={history} width={64} height={20} color={c.color} strokeWidth={1} />
                )}
              </div>
              <div style={{
                fontFamily: theme.font.display,
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
              }}>
                {c.value}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {health && (
        <GlassCard>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.space[2],
            marginBottom: theme.space[3],
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.colors.success,
              boxShadow: `0 0 8px ${theme.colors.success}`,
            }} />
            <span style={{
              color: theme.colors.success,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
            }}>
              System Healthy — v{health.version}
            </span>
          </div>
          <div style={{ display: 'flex', gap: theme.space[2], flexWrap: 'wrap' }}>
            {health.modules?.map((m: string) => (
              <span
                key={m}
                style={{
                  background: theme.colors.primaryMuted,
                  color: theme.colors.primary,
                  padding: `${theme.space[1]} ${theme.space[2]}`,
                  borderRadius: theme.radius.full,
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.semibold,
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
