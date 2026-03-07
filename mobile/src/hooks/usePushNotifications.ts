import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const registered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registered.current) return;

    const register = async () => {
      try {
        if (Platform.OS === 'web') return;

        const Notifications = await import('expo-notifications').catch(() => null);
        if (!Notifications) return;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        setExpoPushToken(token);

        await api('/v1/auth/push-token', {
          method: 'POST',
          body: JSON.stringify({ token, platform: Platform.OS }),
        });

        registered.current = true;
      } catch {}
    };

    register();
  }, [isAuthenticated]);

  useEffect(() => {
    if (Platform.OS === 'web' || !isAuthenticated) return;

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        registered.current = false;
        const register = async () => {
          try {
            const Notifications = await import('expo-notifications').catch(() => null);
            if (!Notifications) return;
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') return;
            const { data } = await Notifications.getExpoPushTokenAsync();
            await api('/v1/auth/push-token', {
              method: 'POST',
              body: JSON.stringify({ token: data, platform: Platform.OS }),
            });
          } catch {}
        };
        register();
      }
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  return { expoPushToken };
}
