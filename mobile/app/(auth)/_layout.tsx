import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0E0B16' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-code" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
