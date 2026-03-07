import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../stores/auth';

/**
 * Handles notification taps: deep-links to chat when user taps a new_message notification.
 * Uses addNotificationResponseReceivedListener for background/foreground and
 * useLastNotificationResponse for cold start (app launched from notification).
 */
export function useNotificationResponse() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isAuthenticated) return;
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      const type = data?.type;
      const conversationId = data?.conversationId;
      const whisperId = data?.whisperId;

      if (type === 'new_message' && conversationId) {
        router.push(`/chat/${conversationId}` as any);
      } else if (type === 'whisper' && whisperId) {
        router.push(`/whispers`);
      }
    });

    return () => sub.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (Platform.OS === 'web' || !lastResponse || !isAuthenticated) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const data = lastResponse.notification.request.content.data as Record<string, string> | undefined;
    const type = data?.type;
    const conversationId = data?.conversationId;
    const id = lastResponse.notification.request.identifier;

    if (handledRef.current === id) return;
    handledRef.current = id;

    if (type === 'new_message' && conversationId) {
      router.push(`/chat/${conversationId}` as any);
    } else if (type === 'whisper') {
      router.push(`/whispers`);
    }
  }, [lastResponse, isAuthenticated]);
}
