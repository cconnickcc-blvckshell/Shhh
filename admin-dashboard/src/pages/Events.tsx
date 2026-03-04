import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminLoading, AdminError } from '../components/AdminPageState';

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
  if (loading && events.length === 0) return <AdminLoading />;

  const phaseColors: Record<string, string> = { discovery: '#60A5FA', upcoming: '#818CF8', live: '#34D399', winding_down: '#FBBF24', post: '#888', archived: '#555' };

  return (
    <div role="main" aria-label="Events management">
      <h2 style={{ color: '#fff', marginBottom: 20 }} id="events-title">Events ({events.length})</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {events.map(e => (
          <div key={e.id} style={{ background: '#1a1a2e', borderRadius: 12, padding: 16, borderLeft: `3px solid ${phaseColors[e.phase || e.status] || '#555'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{e.title}</div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{e.venue_name || 'No venue'} · Hosted by {e.host_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${phaseColors[e.phase || e.status] || '#555'}20`, color: phaseColors[e.phase || e.status] || '#555' }}>
                  {e.phase || e.status}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 10, color: '#888', fontSize: 12 }}>
              <span>📅 {new Date(e.starts_at).toLocaleDateString()}</span>
              <span>👥 {e.going_count || 0} going</span>
              <span>✅ {e.checked_in_count || 0} checked in</span>
              <span>🏠 Capacity: {e.capacity || '∞'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
