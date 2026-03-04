import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from '../src/constants/theme';
import { AuthGuard } from '../src/components/AuthGuard';
import { OfflineBanner } from '../src/components/OfflineBanner';
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
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, headerStyle: { backgroundColor: colors.surface }, headerTintColor: '#fff', title: 'Chat' }} />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/emergency" />
        <Stack.Screen name="profile/privacy" />
        <Stack.Screen name="profile/hosting" />
        <Stack.Screen name="profile/create-event" />
        <Stack.Screen name="profile/event-edit/[id]" />
        <Stack.Screen name="profile/venues" />
        <Stack.Screen name="profile/create-venue" />
        <Stack.Screen name="profile/venue-dashboard/[id]" />
        <Stack.Screen name="profile/venue-edit/[id]" />
        <Stack.Screen name="profile/venue-add-special/[id]" />
        <Stack.Screen name="profile/venue-staff/[id]" />
        <Stack.Screen name="profile/venue-invite-staff/[id]" />
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
      </View>
      </AuthGuard>
    </QueryClientProvider>
  );
}
