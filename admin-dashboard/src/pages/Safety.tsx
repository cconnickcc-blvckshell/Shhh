import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminLoading, AdminError } from '../components/AdminPageState';

export default function Safety() {
  const [alerts, setAlerts] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    adminApi.getSafetyAlerts()
      .then(r => { setAlerts(r.data); setError(null); })
      .catch(() => setError('Failed to load safety alerts.'));
  };

  useEffect(load, []);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (!alerts) return <AdminLoading />;

  return (
    <div role="main" aria-label="Safety center">
      <h2 style={{ color: '#fff', marginBottom: 20 }} id="safety-title">Safety Center</h2>

      {/* Panic Alerts */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: '#EF4444', fontSize: 14, marginBottom: 10 }}>🚨 Panic Alerts (24h)</h3>
        {alerts.panicAlerts.length === 0 ? (
          <div style={{ background: 'rgba(52,211,153,0.08)', padding: 16, borderRadius: 12, color: '#34D399', fontSize: 13 }}>No panic alerts in the last 24 hours ✓</div>
        ) : alerts.panicAlerts.map((a: any) => (
          <div key={a.id} style={{ background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid #EF4444', padding: 14, borderRadius: 8, marginBottom: 8 }}>
            <div style={{ color: '#fff', fontWeight: 700 }}>{a.display_name}</div>
            <div style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{new Date(a.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Missed Check-ins */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: '#FBBF24', fontSize: 14, marginBottom: 10 }}>⏰ Missed Check-ins</h3>
        {alerts.missedCheckins.length === 0 ? (
          <div style={{ background: 'rgba(52,211,153,0.08)', padding: 16, borderRadius: 12, color: '#34D399', fontSize: 13 }}>No missed check-ins ✓</div>
        ) : alerts.missedCheckins.map((c: any) => (
          <div key={c.id} style={{ background: 'rgba(251,191,36,0.08)', borderLeft: '3px solid #FBBF24', padding: 14, borderRadius: 8, marginBottom: 8 }}>
            <div style={{ color: '#fff', fontWeight: 600 }}>{c.display_name}</div>
            <div style={{ color: '#FBBF24', fontSize: 12 }}>Expected: {new Date(c.expected_next_at).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Pending Reports */}
      <div>
        <h3 style={{ color: '#F472B6', fontSize: 14, marginBottom: 10 }}>📋 Pending Reports ({alerts.pendingReports.length})</h3>
        {alerts.pendingReports.map((r: any) => (
          <div key={r.id} style={{ background: '#1a1a2e', padding: 14, borderRadius: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><span style={{ color: '#EF4444', fontWeight: 600 }}>{r.reason}</span></div>
              <span style={{ color: '#666', fontSize: 11 }}>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}><strong>{r.reporter_name}</strong> reported <strong>{r.reported_name}</strong></div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => adminApi.resolveReport(r.id, 'resolved')} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Resolve</button>
              <button onClick={() => adminApi.resolveReport(r.id, 'dismissed')} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#333', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
