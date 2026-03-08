/**
 * Hook to run a callback when the app returns to foreground.
 * Used for C.4 unread sync / A.2 state reconciliation: refetch conversations
 * when user opens app after background (push, etc.) so badge and list stay correct.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

export function useAppForegroundSync(callback: () => void) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const run = () => cbRef.current();

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onVisibility = () => { if (document.visibilityState === 'visible') run(); };
      document.addEventListener('visibilitychange', onVisibility);
      return () => document.removeEventListener('visibilitychange', onVisibility);
    }

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, []);
}
