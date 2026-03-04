/**
 * Shared loading and error states for admin pages.
 * Ensures no silent failures per MASTER_IMPLEMENTATION_CHECKLIST Tier 5.2.
 */
interface LoadingProps {
  message?: string;
}

export function AdminLoading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      style={{ color: '#888', padding: 24, textAlign: 'center' }}
    >
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
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid #EF4444',
        borderRadius: 12,
        padding: 20,
        color: '#EF4444',
        marginBottom: 16,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Error</div>
      <div style={{ color: '#aaa', fontSize: 14, marginBottom: onRetry ? 12 : 0 }}>{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#EF4444',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
          aria-label="Retry"
        >
          Retry
        </button>
      )}
    </div>
  );
}
