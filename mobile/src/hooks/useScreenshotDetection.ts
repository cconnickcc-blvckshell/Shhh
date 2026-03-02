import { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { api } from '../api/client';

export function useScreenshotDetection(conversationId?: string) {
  const reported = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let subscription: { remove: () => void } | null = null;

    const setup = async () => {
      try {
        const ScreenCapture = await import('expo-screen-capture');

        subscription = ScreenCapture.addScreenshotListener(() => {
          if (reported.current) return;
          reported.current = true;

          api('/v1/safety/screenshot', {
            method: 'POST',
            body: JSON.stringify({ conversationId }),
          }).catch(() => {});

          Alert.alert(
            'Screenshot Detected',
            'The other person has been notified that a screenshot was taken.',
            [{ text: 'OK', onPress: () => { reported.current = false; } }]
          );
        });
      } catch {}
    };

    setup();

    return () => { subscription?.remove(); };
  }, [conversationId]);
}
