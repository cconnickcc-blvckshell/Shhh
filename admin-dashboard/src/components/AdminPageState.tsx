/**
 * Shared loading and error states for admin pages.
 * Ensures no silent failures per MASTER_IMPLEMENTATION_CHECKLIST Tier 5.2.
 */
import { theme } from '../theme';
import { GlassButton } from './GlassButton';

interface LoadingProps {
  message?: string;
}

export function AdminLoading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      style={{
        color: theme.colors.textMuted,
        padding: theme.space[8],
        textAlign: 'center',
        fontFamily: theme.font.body,
        fontSize: theme.fontSize.base,
      }}
    >
      <div style={{
        width: 32,
        height: 32,
        margin: '0 auto 16px',
        border: `2px solid ${theme.colors.primaryMuted}`,
        borderTopColor: theme.colors.primary,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      {message}
    </div>
  );
}

interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

export function AdminError({ message, onRetry }: ErrorProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: theme.colors.dangerMuted,
        border: `1px solid ${theme.colors.danger}`,
        borderRadius: theme.radius.lg,
        padding: theme.space[5],
        marginBottom: theme.space[4],
      }}
    >
      <div style={{
        fontFamily: theme.font.display,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.danger,
        marginBottom: theme.space[2],
      }}>
        Error
      </div>
      <div style={{
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        marginBottom: onRetry ? theme.space[3] : 0,
      }}>
        {message}
      </div>
      {onRetry && (
        <GlassButton variant="danger" onClick={onRetry} style={{ marginTop: theme.space[2] }}>
          Retry
        </GlassButton>
      )}
    </div>
  );
}
