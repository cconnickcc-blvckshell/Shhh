import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonCards } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { Sparkline } from '../components/Sparkline';
import { theme } from '../theme';

export default function Revenue() {
  const [revenue, setRevenue] = useState<any>(null);
  const [history, setHistory] = useState<Array<{ date: string; revenue_cents: number; new_subs: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    Promise.all([
      adminApi.getRevenue(),
      adminApi.getRevenueHistory(30),
    ])
      .then(([r, h]) => {
        setRevenue(r.data);
        setHistory((h as any).data || []);
      })
      .catch(() => setError('Failed to load revenue data.'));
  };

  useEffect(load, []);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (!revenue) return <SkeletonCards count={6} />;

  const mrr = (revenue.mrr?.mrr_cents || 0) / 100;
  const adRev = (revenue.adRevenue?.total_ad_revenue || 0) / 100;
  const payingUsers = revenue.mrr?.paying_users || 0;

  const cards = [
    { label: 'MRR', value: `$${mrr.toFixed(2)}`, color: theme.colors.success },
    { label: 'Ad Revenue (Total)', value: `$${adRev.toFixed(2)}`, color: theme.colors.primary },
    { label: 'Paying Users', value: payingUsers, color: theme.colors.info },
    { label: 'Total Impressions', value: revenue.adRevenue?.total_impressions || 0, color: theme.colors.warning },
    { label: 'Total Ad Taps', value: revenue.adRevenue?.total_taps || 0, color: theme.colors.accentPink },
    { label: 'Ad Placements', value: revenue.adRevenue?.total_placements || 0, color: theme.colors.accent },
  ];

  return (
    <div role="main" aria-label="Revenue dashboard">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[6],
      }} id="revenue-title">
        Revenue
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: theme.space[4],
        marginBottom: theme.space[6],
      }}>
        {cards.map((c) => {
          const revData = c.label === 'MRR' && history.length >= 2 ? history.map((d) => (d.revenue_cents || 0) / 100) : [];
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
                }}>{c.label}</span>
                {revData.length >= 2 && <Sparkline data={revData} width={72} height={28} color={c.color} strokeWidth={1} />}
              </div>
              <div style={{
                fontFamily: theme.font.display,
                fontSize: theme.fontSize['2xl'],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
              }}>{c.value}</div>
            </GlassCard>
          );
        })}
      </div>

      {history.length >= 2 && (
        <>
          <h3 style={{
            fontFamily: theme.font.display,
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.text,
            marginBottom: theme.space[3],
          }}>
            Revenue (30 days)
          </h3>
          <GlassCard style={{ marginBottom: theme.space[6] }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
              {history.map((d) => {
                const maxRev = Math.max(...history.map((x) => x.revenue_cents || 0), 1);
                const h = ((d.revenue_cents || 0) / maxRev) * 100;
                return (
                  <div
                    key={d.date}
                    title={`${d.date}: $${((d.revenue_cents || 0) / 100).toFixed(2)}`}
                    style={{
                      flex: 1,
                      minWidth: 4,
                      height: `${Math.max(4, h)}%`,
                      background: `linear-gradient(180deg, ${theme.colors.primary} 0%, ${theme.colors.accentPink} 100%)`,
                      borderRadius: 2,
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: theme.space[2], fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              <span>{history[0]?.date}</span>
              <span>{history[history.length - 1]?.date}</span>
            </div>
          </GlassCard>
        </>
      )}

      <h3 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.space[3],
      }}>
        Subscription Breakdown
      </h3>
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: theme.glass.border }}>
              {['Tier', 'Subscribers', 'Revenue/mo'].map(h => (
                <th key={h} style={{
                  padding: `${theme.space[3]} ${theme.space[4]}`,
                  textAlign: 'left',
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(revenue.subscriptions || []).map((s: any) => (
              <tr key={s.tier} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.primary, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.base, textTransform: 'capitalize' }}>{s.tier}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.text, fontSize: theme.fontSize.base }}>{s.cnt}</td>
                <td style={{ padding: `${theme.space[3]} ${theme.space[4]}`, color: theme.colors.success, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.base }}>${(s.revenue_cents / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
