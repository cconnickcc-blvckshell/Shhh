import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';

type StatusData = {
  onlineNow: number;
  panicAlerts: number;
  pendingReports: number;
  pendingMod: number;
  lastUpdated: Date | null;
};

type CommandCenterContextValue = {
  status: StatusData;
  refresh: () => void;
  isLive: boolean;
};

const CommandCenterContext = createContext<CommandCenterContextValue | null>(null);

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusData>({
    onlineNow: 0,
    panicAlerts: 0,
    pendingReports: 0,
    pendingMod: 0,
    lastUpdated: null,
  });
  const [isLive, setIsLive] = useState(false);
  const navigate = useNavigate();

  const refresh = useCallback(() => {
    adminApi.getOverview()
      .then((r) => {
        const d = r.data;
        const s = d?.safety || {};
        const content = d?.content || {};
        setStatus({
          onlineNow: content.online_now ?? 0,
          panicAlerts: s.panic_24h ?? 0,
          pendingReports: s.pending_reports ?? 0,
          pendingMod: s.pending_moderation ?? 0,
          lastUpdated: new Date(),
        });
        setIsLive(true);
      })
      .catch(() => setIsLive(false));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        refresh();
        window.dispatchEvent(new CustomEvent('command-center-refresh'));
        return;
      }

      const navPaths = ['/', '/users', '/revenue', '/venues', '/ads', '/events', '/reports', '/safety', '/audit', '/settings', '/map'];
      const key = e.key;
      if (key >= '1' && key <= '9') {
        const idx = parseInt(key, 10) - 1;
        if (navPaths[idx]) {
          e.preventDefault();
          navigate(navPaths[idx]);
        }
      } else if (key === '0') {
        e.preventDefault();
        navigate('/settings');
      } else if (key === 'm' || key === 'M') {
        e.preventDefault();
        navigate('/map');
      } else if (key === 'd' || key === 'D') {
        e.preventDefault();
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, refresh]);

  return (
    <CommandCenterContext.Provider value={{ status, refresh, isLive }}>
      {children}
    </CommandCenterContext.Provider>
  );
}

export function useCommandCenter() {
  const ctx = useContext(CommandCenterContext);
  if (!ctx) throw new Error('useCommandCenter must be used within CommandCenterProvider');
  return ctx;
}
