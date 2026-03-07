import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { messagingApi } from '../api/client';
import { useAuthStore } from '../stores/auth';

type UnreadBadgeContextValue = {
  unreadCount: number;
  refetch: () => void;
};

const UnreadBadgeContext = createContext<UnreadBadgeContextValue | null>(null);

export function UnreadBadgeProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const r = await messagingApi.getUnreadTotal();
      setUnreadCount(r.total ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    import('expo-notifications')
      .then((N) => N.default.setBadgeCountAsync(unreadCount))
      .catch(() => {});
  }, [unreadCount]);

  return (
    <UnreadBadgeContext.Provider value={{ unreadCount, refetch }}>
      {children}
    </UnreadBadgeContext.Provider>
  );
}

export function useUnreadBadge() {
  const ctx = useContext(UnreadBadgeContext);
  return ctx ?? { unreadCount: 0, refetch: () => {} };
}
