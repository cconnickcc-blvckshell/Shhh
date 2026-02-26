import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';

export default function Revenue() {
  const [revenue, setRevenue] = useState<any>(null);

  useEffect(() => { adminApi.getRevenue().then(r => setRevenue(r.data)).catch(() => {}); }, []);

  if (!revenue) return <div style={{ color: '#888', padding: 20 }}>Loading...</div>;

  const mrr = (revenue.mrr?.mrr_cents || 0) / 100;
  const adRev = (revenue.adRevenue?.total_ad_revenue || 0) / 100;
  const payingUsers = revenue.mrr?.paying_users || 0;

  const cards = [
    { label: 'MRR', value: `$${mrr.toFixed(2)}`, color: '#34D399' },
    { label: 'Ad Revenue (Total)', value: `$${adRev.toFixed(2)}`, color: '#A855F7' },
    { label: 'Paying Users', value: payingUsers, color: '#60A5FA' },
    { label: 'Total Impressions', value: revenue.adRevenue?.total_impressions || 0, color: '#FBBF24' },
    { label: 'Total Ad Taps', value: revenue.adRevenue?.total_taps || 0, color: '#F472B6' },
    { label: 'Ad Placements', value: revenue.adRevenue?.total_placements || 0, color: '#818CF8' },
  ];

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: 20 }}>Revenue</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#1a1a2e', padding: 20, borderRadius: 12, borderLeft: `3px solid ${c.color}` }}>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ color: '#fff', marginBottom: 12 }}>Subscription Breakdown</h3>
      <div style={{ background: '#1a1a2e', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid #333' }}>
            {['Tier', 'Subscribers', 'Revenue/mo'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontSize: 11 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {(revenue.subscriptions || []).map((s: any) => (
              <tr key={s.tier} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '10px 16px', color: '#A855F7', fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{s.tier}</td>
                <td style={{ padding: '10px 16px', color: '#fff', fontSize: 14 }}>{s.cnt}</td>
                <td style={{ padding: '10px 16px', color: '#34D399', fontWeight: 600, fontSize: 14 }}>${(s.revenue_cents / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
