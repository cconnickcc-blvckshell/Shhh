import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';

export default function Venues() {
  const [venues, setVenues] = useState<any[]>([]);
  useEffect(() => { adminApi.listVenues().then(r => setVenues(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: 20 }}>Venues ({venues.length})</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {venues.map(v => (
          <div key={v.id} style={{ background: '#1a1a2e', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{v.name}</div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{v.tagline || v.type} · {v.price_range || '$$'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: v.is_claimed ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', color: v.is_claimed ? '#34D399' : '#555' }}>
                  {v.is_claimed ? 'Claimed' : 'Unclaimed'}
                </span>
                {v.venue_tier && <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: 'rgba(147,51,234,0.15)', color: '#A855F7' }}>{v.venue_tier}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              <div><span style={{ color: '#34D399', fontWeight: 700, fontSize: 18 }}>{v.current_checkins}</span><span style={{ color: '#666', fontSize: 11, marginLeft: 4 }}>checked in</span></div>
              <div><span style={{ color: '#60A5FA', fontWeight: 700, fontSize: 18 }}>{v.upcoming_events}</span><span style={{ color: '#666', fontSize: 11, marginLeft: 4 }}>events</span></div>
              <div><span style={{ color: '#FBBF24', fontWeight: 700, fontSize: 18 }}>{v.active_ads}</span><span style={{ color: '#666', fontSize: 11, marginLeft: 4 }}>active ads</span></div>
              <div><span style={{ color: '#F472B6', fontWeight: 700, fontSize: 18 }}>{v.avg_rating ? parseFloat(v.avg_rating).toFixed(1) : '—'}</span><span style={{ color: '#666', fontSize: 11, marginLeft: 4 }}>rating</span></div>
            </div>
            {v.description && <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>{v.description.substring(0, 120)}...</div>}
          </div>
        ))}
        {venues.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>No venues yet</div>}
      </div>
    </div>
  );
}
