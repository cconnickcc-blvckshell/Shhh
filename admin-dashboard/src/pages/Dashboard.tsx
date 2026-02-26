import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    adminApi.getOverview().then(r => setData(r.data)).catch(() => {
      adminApi.getStats().then(r => setData({ users: r.data.users, safety: r.data.reports, revenue: {}, content: {}, system: {} })).catch(() => {});
    });
    adminApi.getHealth().then(setHealth).catch(() => {});
  }, []);

  if (!data) return <div style={{ color: '#888', padding: 20 }}>Loading...</div>;

  const u = data.users || {};
  const r = data.revenue || {};
  const s = data.safety || {};
  const c = data.content || {};

  const cards = [
    { label: 'Online Now', value: c.online_now || 0, color: '#34D399', icon: '🟢' },
    { label: 'Total Users', value: u.total || u.total_users || 0, color: '#60A5FA', icon: '👥' },
    { label: 'New (24h)', value: u.new_24h || u.new_today || 0, color: '#818CF8', icon: '✨' },
    { label: 'MRR', value: `$${((r.mrr_cents || 0) / 100).toFixed(0)}`, color: '#34D399', icon: '💰' },
    { label: 'Paying Users', value: r.paying_users || 0, color: '#A855F7', icon: '💎' },
    { label: 'Ad Revenue', value: `$${((r.ad_revenue_cents || 0) / 100).toFixed(0)}`, color: '#FBBF24', icon: '📊' },
    { label: 'Panic Alerts', value: s.panic_24h || 0, color: s.panic_24h > 0 ? '#EF4444' : '#34D399', icon: '🚨' },
    { label: 'Pending Reports', value: s.pending_reports || 0, color: s.pending_reports > 0 ? '#EF4444' : '#34D399', icon: '📋' },
    { label: 'Pending Mod', value: s.pending_moderation || 0, color: s.pending_moderation > 0 ? '#FBBF24' : '#34D399', icon: '🔍' },
    { label: 'Active Events', value: c.active_events || 0, color: '#F472B6', icon: '🎉' },
    { label: 'Active Venues', value: c.active_venues || 0, color: '#818CF8', icon: '🏢' },
    { label: 'Whispers (24h)', value: c.whispers_24h || 0, color: '#A855F7', icon: '👂' },
  ];

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: 20 }}>Command Center</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#1a1a2e', padding: 16, borderRadius: 12, borderLeft: `3px solid ${c.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
            </div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginTop: 6 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {health && (
        <div style={{ background: '#1a1a2e', padding: 16, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399' }} />
            <span style={{ color: '#34D399', fontSize: 13, fontWeight: 600 }}>System Healthy — v{health.version}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {health.modules?.map((m: string) => (
              <span key={m} style={{ background: '#16213e', color: '#60A5FA', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600 }}>{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
