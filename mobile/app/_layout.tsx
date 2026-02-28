import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from '../src/constants/theme';
import { AuthGuard } from '../src/components/AuthGuard';
import { setOnUnauthorized } from '../src/api/client';
import { useAuthStore } from '../src/stores/auth';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    setOnUnauthorized(() => useAuthStore.getState().clearSession());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AuthGuard>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, headerStyle: { backgroundColor: colors.surface }, headerTintColor: '#fff', title: 'Chat' }} />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/emergency" />
        <Stack.Screen name="profile/privacy" />
        <Stack.Screen name="album/index" />
        <Stack.Screen name="album/[id]" />
        <Stack.Screen name="couple/index" />
        <Stack.Screen name="verify/index" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="profile/status" />
        <Stack.Screen name="venue/[id]" />
        <Stack.Screen name="whispers/index" />
        <Stack.Screen name="subscription/index" />
      </Stack>
      </AuthGuard>
    </QueryClientProvider>
  );
}
