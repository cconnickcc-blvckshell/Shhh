import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';

interface LogEntry {
  id: string;
  display_name: string;
  action: string;
  gdpr_category: string;
  created_at: string;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    adminApi.getAuditLogs(100).then(r => setLogs(r.data as LogEntry[])).catch(() => {});
  }, []);

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Audit Log</h2>
      <div style={{ background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              {['Time', 'User', 'Action', 'Category'].map(h => (
                <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '10px 12px', color: '#888', fontSize: '0.875rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: '#fff', fontSize: '0.875rem' }}>{log.display_name || '—'}</td>
                <td style={{ padding: '10px 12px', color: '#0984e3', fontSize: '0.875rem', fontFamily: 'monospace' }}>{log.action}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ background: '#16213e', color: '#6c5ce7', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{log.gdpr_category || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
