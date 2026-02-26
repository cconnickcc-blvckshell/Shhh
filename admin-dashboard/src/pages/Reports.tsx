import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';

interface Report {
  id: string;
  reporter_name: string;
  reported_name: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState('pending');

  const load = () => {
    adminApi.getReports(filter).then(r => setReports(r.data as Report[])).catch(() => {});
  };

  useEffect(load, [filter]);

  const resolve = async (id: string, status: string) => {
    await adminApi.resolveReport(id, status);
    load();
  };

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Reports</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['pending', 'reviewing', 'resolved', 'dismissed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === s ? '#e94560' : '#1a1a2e', color: '#fff', cursor: 'pointer' }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reports.length === 0 && <div style={{ color: '#666' }}>No reports found.</div>}
        {reports.map(r => (
          <div key={r.id} style={{ background: '#1a1a2e', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#e94560', fontWeight: 'bold' }}>{r.reason}</span>
              <span style={{ color: '#666', fontSize: '0.75rem' }}>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div style={{ color: '#aaa', fontSize: '0.875rem' }}>
              <strong>{r.reporter_name}</strong> reported <strong>{r.reported_name}</strong>
            </div>
            {r.description && <div style={{ color: '#888', fontSize: '0.875rem', marginTop: '0.25rem' }}>{r.description}</div>}
            {r.status === 'pending' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button onClick={() => resolve(r.id, 'resolved')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#d63031', color: '#fff', cursor: 'pointer' }}>Resolve</button>
                <button onClick={() => resolve(r.id, 'dismissed')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#636e72', color: '#fff', cursor: 'pointer' }}>Dismiss</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
