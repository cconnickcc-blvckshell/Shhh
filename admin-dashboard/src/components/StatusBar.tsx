import { Link } from 'react-router-dom';
import { useCommandCenter } from '../context/CommandCenterContext';
import { theme } from '../theme';

function formatLastUpdated(d: Date | null): string {
  if (!d) return '—';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 10) return 'Just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  return `${min}m ago`;
}

export function StatusBar() {
  const { status, refresh, isLive } = useCommandCenter();

  return (
    <div
      className="status-bar-inner"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.space[6],
        padding: `${theme.space[2]} ${theme.space[4]}`,
        background: theme.glass.bg,
        backdropFilter: theme.glass.blur,
        WebkitBackdropFilter: theme.glass.blur,
        borderBottom: theme.glass.border,
        fontFamily: theme.font.body,
        fontSize: theme.fontSize.sm,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.space[2] }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: isLive ? theme.colors.success : theme.colors.textDim,
            boxShadow: isLive ? `0 0 6px ${theme.colors.success}` : 'none',
            animation: isLive ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          }}
        />
        <span style={{ color: theme.colors.textMuted }}>LIVE</span>
      </div>

      <div style={{ display: 'flex', gap: theme.space[6] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.space[2] }}>
          <span style={{ color: theme.colors.textMuted }}>Online</span>
          <span
            style={{
              fontFamily: theme.font.display,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.success,
              minWidth: 24,
              textAlign: 'right',
            }}
          >
            {status.onlineNow}
          </span>
        </div>
        <Link to="/safety" data-status-link style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: theme.space[2], cursor: 'pointer' }}>
          <span style={{ color: theme.colors.textMuted }}>Panic</span>
          <span
            style={{
              fontFamily: theme.font.display,
              fontWeight: theme.fontWeight.bold,
              color: status.panicAlerts > 0 ? theme.colors.danger : theme.colors.textMuted,
              minWidth: 24,
              textAlign: 'right',
            }}
          >
            {status.panicAlerts}
          </span>
        </Link>
        <Link to="/reports" data-status-link style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: theme.space[2], cursor: 'pointer' }}>
          <span style={{ color: theme.colors.textMuted }}>Reports</span>
          <span
            style={{
              fontFamily: theme.font.display,
              fontWeight: theme.fontWeight.bold,
              color: status.pendingReports > 0 ? theme.colors.danger : theme.colors.textMuted,
              minWidth: 24,
              textAlign: 'right',
            }}
          >
            {status.pendingReports}
          </span>
        </Link>
        <Link to="/moderation" data-status-link style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: theme.space[2], cursor: 'pointer' }}>
          <span style={{ color: theme.colors.textMuted }}>Mod</span>
          <span
            style={{
              fontFamily: theme.font.display,
              fontWeight: theme.fontWeight.bold,
              color: status.pendingMod > 0 ? theme.colors.warning : theme.colors.textMuted,
              minWidth: 24,
              textAlign: 'right',
            }}
          >
            {status.pendingMod}
          </span>
        </Link>
      </div>

      <div className="status-bar-mobile-extra" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: theme.space[4] }}>
        <span style={{ color: theme.colors.textDim, fontSize: theme.fontSize.xs }}>
          Updated {formatLastUpdated(status.lastUpdated)}
        </span>
        <button
          onClick={refresh}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.xs,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          title="Refresh (R)"
        >
          Refresh
        </button>
        <span style={{ color: theme.colors.textDim, fontSize: 10 }} title="Keyboard shortcuts">
          R · 1-9 · M
        </span>
      </div>
    </div>
  );
}
