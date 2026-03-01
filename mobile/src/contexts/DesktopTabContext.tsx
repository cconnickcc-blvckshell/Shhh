import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname, router } from 'expo-router';

export type DesktopTabId = 'explore' | 'messages' | 'events' | 'profile';

const TAB_TO_ROUTE: Record<DesktopTabId, string> = {
  explore: '/(tabs)',
  messages: '/(tabs)/messages',
  events: '/(tabs)/events',
  profile: '/(tabs)/profile',
};

type ContextValue = {
  activeTab: DesktopTabId;
  setActiveTab: (tab: DesktopTabId) => void;
};

const DesktopTabContext = createContext<ContextValue | null>(null);

export function DesktopTabProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeTab, setActiveTabState] = useState<DesktopTabId>('explore');

  const setActiveTab = useCallback((tab: DesktopTabId) => {
    setActiveTabState(tab);
    router.replace(TAB_TO_ROUTE[tab] as any);
  }, []);

  useEffect(() => {
    if (pathname == null) return;
    let tab: DesktopTabId = 'explore';
    if (pathname === '/(tabs)' || pathname === '/(tabs)/') tab = 'explore';
    else if (pathname.startsWith('/(tabs)/messages')) tab = 'messages';
    else if (pathname.startsWith('/(tabs)/events')) tab = 'events';
    else if (pathname.startsWith('/(tabs)/profile')) tab = 'profile';
    setActiveTabState(tab);
  }, [pathname]);

  return (
    <DesktopTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </DesktopTabContext.Provider>
  );
}

export function useDesktopTab() {
  const ctx = useContext(DesktopTabContext);
  return ctx;
}
