import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';

interface Stats {
  moderation: { pending: number; assigned: number; approved_today: number; rejected_today: number; escalated: number };
  users: { total_users: number; active_users: number; verified_users: number; id_verified_users: number; new_today: number };
  reports: { pending_reports: number; new_today: number };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<{ status: string; version: string; modules: string[] } | null>(null);

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data as unknown as Stats)).catch(() => {});
    adminApi.getHealth().then(setHealth).catch(() => {});
  }, []);

  if (!stats) return <div style={{ color: '#aaa', padding: '2rem' }}>Loading...</div>;

  const cards = [
    { label: 'Total Users', value: stats.users.total_users, color: '#6c5ce7' },
    { label: 'Active Users', value: stats.users.active_users, color: '#00b894' },
    { label: 'Verified', value: stats.users.verified_users, color: '#0984e3' },
    { label: 'New Today', value: stats.users.new_today, color: '#fdcb6e' },
    { label: 'Pending Moderation', value: stats.moderation.pending, color: '#e17055' },
    { label: 'Pending Reports', value: stats.reports.pending_reports, color: '#d63031' },
  ];

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Dashboard Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${c.color}` }}>
            <div style={{ color: '#aaa', fontSize: '0.875rem' }}>{c.label}</div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {health && (
        <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>System Health</h3>
          <div style={{ color: '#00b894', marginBottom: '0.5rem' }}>● Status: {health.status} | v{health.version}</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {health.modules.map(m => (
              <span key={m} style={{ background: '#16213e', color: '#0984e3', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem' }}>{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
