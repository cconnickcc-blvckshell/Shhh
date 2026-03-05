import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonCards } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme';

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
  if (loading && adSettings.length === 0) return <SkeletonCards count={2} />;

  return (
    <div role="main" aria-label="System settings">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[6],
      }} id="settings-title">
        System Settings
      </h2>

      <GlassCard style={{ marginBottom: theme.space[4] }}>
        <h3 style={{
          fontFamily: theme.font.display,
          fontSize: theme.fontSize.lg,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.text,
          marginBottom: theme.space[4],
        }}>Ad Controls</h3>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${theme.space[4]} 0`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div>
            <div style={{ color: theme.colors.text, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold }}>Global Ad Switch</div>
            <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: theme.space[1] }}>Enable or disable all ads platform-wide</div>
          </div>
          <GlassButton
            variant={globalConfig.enabled ? 'danger' : 'success'}
            onClick={toggleAds}
          >
            {globalConfig.enabled ? 'KILL ADS' : 'ENABLE ADS'}
          </GlassButton>
        </div>
        <div style={{ padding: `${theme.space[4]} 0`, color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
          <div>Density multiplier: <strong style={{ color: theme.colors.text }}>{globalConfig.density_multiplier || 1.0}x</strong></div>
          <div style={{ marginTop: theme.space[1] }}>Status: <strong style={{ color: globalConfig.enabled ? theme.colors.success : theme.colors.danger }}>{globalConfig.enabled ? 'Enabled' : 'Disabled'}</strong></div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 style={{
          fontFamily: theme.font.display,
          fontSize: theme.fontSize.lg,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.text,
          marginBottom: theme.space[4],
        }}>System Info</h3>
        <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, lineHeight: 2 }}>
          <div>API Version: <strong style={{ color: theme.colors.text }}>v0.5.0</strong></div>
          <div>Environment: <strong style={{ color: theme.colors.text }}>development</strong></div>
          <div>JWT Expiry: <strong style={{ color: theme.colors.text }}>2h (dev) / 15m (prod)</strong></div>
          <div>Auth Rate Limit: <strong style={{ color: theme.colors.text }}>50/15min (dev) / 5/15min (prod)</strong></div>
          <div>Workers: <strong style={{ color: theme.colors.text }}>6 scheduled (presence, intents, sessions, media, whispers, events)</strong></div>
        </div>
      </GlassCard>
    </div>
  );
}
