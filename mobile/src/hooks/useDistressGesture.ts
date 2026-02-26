import { useEffect, useRef } from 'react';
import { Platform, Vibration } from 'react-native';
import { safetyApi } from '../api/client';

const SHAKE_THRESHOLD = 800;
const REQUIRED_SHAKES = 5;
const WINDOW_MS = 3000;

export function useDistressGesture() {
  const shakeTimestamps = useRef<number[]>([]);
  const triggered = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let subscription: { remove: () => void } | null = null;

    const setup = async () => {
      try {
        const { Accelerometer } = await import('expo-sensors');

        let lastUpdate = 0;
        let lastX = 0, lastY = 0, lastZ = 0;

        Accelerometer.setUpdateInterval(100);

        subscription = Accelerometer.addListener(({ x, y, z }: { x: number; y: number; z: number }) => {
          const now = Date.now();
          if (now - lastUpdate < 100) return;

          const deltaX = Math.abs(x - lastX);
          const deltaY = Math.abs(y - lastY);
          const deltaZ = Math.abs(z - lastZ);
          const speed = (deltaX + deltaY + deltaZ) / ((now - lastUpdate) / 1000);

          lastUpdate = now;
          lastX = x; lastY = y; lastZ = z;

          if (speed > SHAKE_THRESHOLD) {
            shakeTimestamps.current.push(now);
            shakeTimestamps.current = shakeTimestamps.current.filter(t => now - t < WINDOW_MS);

            if (shakeTimestamps.current.length >= REQUIRED_SHAKES && !triggered.current) {
              triggered.current = true;
              Vibration.vibrate([0, 100, 50, 100, 50, 100]);
              triggerDistress();
            }
          }
        });
      } catch {}
    };

    setup();

    return () => { subscription?.remove(); };
  }, []);

  const triggerDistress = async () => {
    try {
      const Location = await import('expo-location').catch(() => null);
      let lat: number | undefined;
      let lng: number | undefined;

      if (Location) {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        } catch {}
      }

      await safetyApi.panic(lat, lng);

      setTimeout(() => { triggered.current = false; }, 30000);
    } catch {}
  };
}
