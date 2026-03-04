import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminLoading, AdminError } from '../components/AdminPageState';

export default function Settings() {
  const [adSettings, setAdSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.getAdSettings()
      .then(r => { setAdSettings(r.data); setError(null); })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleAds = async () => {
    const global = adSettings.find(s => s.id === 'global');
    if (!global) return;
    const current = global.value?.enabled ?? true;
    await adminApi.updateAdSetting('global', { ...global.value, enabled: !current });
    load();
  };

  const globalConfig = adSettings.find(s => s.id === 'global')?.value || {};

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading && adSettings.length === 0) return <AdminLoading />;

  return (
    <div role="main" aria-label="System settings">
      <h2 style={{ color: '#fff', marginBottom: 20 }} id="settings-title">System Settings</h2>

      <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 12 }}>Ad Controls</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #222' }}>
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Global Ad Switch</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Enable or disable all ads platform-wide</div>
          </div>
          <button onClick={toggleAds} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: globalConfig.enabled ? '#DC2626' : '#34D399', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            {globalConfig.enabled ? 'KILL ADS' : 'ENABLE ADS'}
          </button>
        </div>

        <div style={{ padding: '12px 0', color: '#888', fontSize: 13 }}>
          <div>Density multiplier: <strong style={{ color: '#fff' }}>{globalConfig.density_multiplier || 1.0}x</strong></div>
          <div style={{ marginTop: 4 }}>Status: <strong style={{ color: globalConfig.enabled ? '#34D399' : '#EF4444' }}>{globalConfig.enabled ? 'Enabled' : 'Disabled'}</strong></div>
        </div>
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 12 }}>System Info</h3>
        <div style={{ color: '#888', fontSize: 13, lineHeight: 2 }}>
          <div>API Version: <strong style={{ color: '#fff' }}>v0.5.0</strong></div>
          <div>Environment: <strong style={{ color: '#fff' }}>development</strong></div>
          <div>JWT Expiry: <strong style={{ color: '#fff' }}>2h (dev) / 15m (prod)</strong></div>
          <div>Auth Rate Limit: <strong style={{ color: '#fff' }}>50/15min (dev) / 5/15min (prod)</strong></div>
          <div>Workers: <strong style={{ color: '#fff' }}>6 scheduled (presence, intents, sessions, media, whispers, events)</strong></div>
        </div>
      </div>
    </div>
  );
}
