import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminLoading, AdminError } from '../components/AdminPageState';

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
  if (loading && ads.length === 0) return <AdminLoading />;

  return (
    <div role="main" aria-label="Ad placements">
      <h2 style={{ color: '#fff', marginBottom: 20 }} id="ads-title">Ad Placements</h2>
      <div style={{ background: '#1a1a2e', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid #333' }}>
            {['Venue', 'Surface', 'Headline', 'Impressions', 'Taps', 'CTR', 'Spent', 'Status', 'Actions'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#888', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {ads.map(ad => (
              <tr key={ad.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '10px 12px', color: '#fff', fontSize: 13 }}>{ad.venue_name || '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, background: '#16213e', color: '#60A5FA' }}>{ad.surface}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#ccc', fontSize: 12 }}>{ad.headline}</td>
                <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, fontSize: 13 }}>{ad.impression_count}</td>
                <td style={{ padding: '10px 12px', color: '#A855F7', fontWeight: 600, fontSize: 13 }}>{ad.tap_count}</td>
                <td style={{ padding: '10px 12px', color: '#FBBF24', fontSize: 12 }}>{ad.ctr_percent}%</td>
                <td style={{ padding: '10px 12px', color: '#34D399', fontWeight: 600, fontSize: 13 }}>${ad.spent_dollars}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: ad.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', color: ad.is_active ? '#34D399' : '#EF4444' }}>
                    {ad.is_active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => adminApi.toggleAd(ad.id, !ad.is_active).then(load)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: ad.is_active ? '#DC2626' : '#34D399', color: '#fff', cursor: 'pointer', fontSize: 10 }}>
                    {ad.is_active ? 'Pause' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
