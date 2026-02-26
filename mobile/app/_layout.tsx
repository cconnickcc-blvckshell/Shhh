import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from '../src/constants/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, headerStyle: { backgroundColor: colors.surface }, headerTintColor: '#fff', title: 'Chat' }} />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="album/index" />
        <Stack.Screen name="album/[id]" />
        <Stack.Screen name="couple/index" />
        <Stack.Screen name="verify/index" />
        <Stack.Screen name="user/[id]" />
      </Stack>
    </QueryClientProvider>
  );
}
