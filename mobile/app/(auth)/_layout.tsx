import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../src/stores/auth';

const ONBOARDING_DONE_KEY = 'shhh_onboarding_done';

async function getOnboardingDone(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(ONBOARDING_DONE_KEY) === '1'; } catch { return false; }
  }
  try { return (await SecureStore.getItemAsync(ONBOARDING_DONE_KEY)) === '1'; } catch { return false; }
}

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [authRedirectDone, setAuthRedirectDone] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthRedirectDone(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const done = await getOnboardingDone();
      if (cancelled) return;
      if (done) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
      setAuthRedirectDone(true);
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  if (isAuthenticated && !authRedirectDone) {
    return null;
  }

  return (
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0E0B16' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-code" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="onboarding-intent" />
    </Stack>
  );
}
