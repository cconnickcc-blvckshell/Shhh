import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, router } from 'expo-router';

export type DesktopTabId = 'explore' | 'messages' | 'events' | 'profile';

const TAB_TO_ROUTE: Record<DesktopTabId, string> = {
  explore: '/(tabs)',
  messages: '/(tabs)/messages',
  events: '/(tabs)/events',
  profile: '/(tabs)/profile',
};

function pathnameToTab(pathname: string | null): DesktopTabId {
  if (pathname == null) return 'explore';
  if (pathname === '/(tabs)' || pathname === '/(tabs)/') return 'explore';
  if (pathname.startsWith('/(tabs)/messages')) return 'messages';
  if (pathname.startsWith('/(tabs)/events')) return 'events';
  if (pathname.startsWith('/(tabs)/profile')) return 'profile';
  return 'explore';
}

type ContextValue = {
  activeTab: DesktopTabId;
  setActiveTab: (tab: DesktopTabId) => void;
};

const DesktopTabContext = createContext<ContextValue | null>(null);

export function DesktopTabProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeTab, setActiveTabState] = useState<DesktopTabId>(() => pathnameToTab(pathname));
  const skipNextPathnameSync = useRef(false);

  const setActiveTab = useCallback((tab: DesktopTabId) => {
    skipNextPathnameSync.current = true;
    setActiveTabState(tab);
    router.replace(TAB_TO_ROUTE[tab] as any);
  }, []);

  useEffect(() => {
    if (pathname == null) return;
    if (skipNextPathnameSync.current) {
      skipNextPathnameSync.current = false;
      return;
    }
    const tab = pathnameToTab(pathname);
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
