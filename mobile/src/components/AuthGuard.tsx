import { useEffect, useState } from 'react';
import { usePathname, router } from 'expo-router';
import { useAuthStore } from '../stores/auth';
import { SplashScreen } from './SplashScreen';

const SPLASH_MIN_MS = 280;

/**
 * Wraps the app to enforce auth/session truth:
 * - Shows premium splash until hydrated, then Stack.
 * - Redirects unauthenticated users to (auth).
 * - Redirects authenticated users away from (auth) to (tabs).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup = pathname?.includes('(auth)') ?? false;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
      return;
    }
    // When authenticated and in auth group, let AuthLayout handle redirect
    // (onboarding vs tabs). Do NOT redirect here — avoids race with
    // registerEmail/login flows and prevents "stale" navigation state errors.
  }, [hydrated, pathname, isAuthenticated]);

  if (!hydrated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
