import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { discoverApi } from '../api/client';

interface LocationState {
  latitude: number;
  longitude: number;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

const DEFAULT_LAT = 40.7128;
const DEFAULT_LNG = -74.006;

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    loading: true,
    error: null,
    permissionGranted: false,
  });

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setState(prev => ({ ...prev, loading: false, permissionGranted: true }));
      return true;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setState(prev => ({ ...prev, permissionGranted: granted }));
      return granted;
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to request location permission' }));
      return false;
    }
  }, []);

  const updateLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      if (Platform.OS === 'web') {
        setState(prev => ({ ...prev, loading: false }));
        await discoverApi.updateLocation(DEFAULT_LAT, DEFAULT_LNG);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setState(prev => ({ ...prev, latitude, longitude, loading: false, error: null }));
      await discoverApi.updateLocation(latitude, longitude);
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
      await discoverApi.updateLocation(DEFAULT_LAT, DEFAULT_LNG);
    }
  }, []);

  useEffect(() => {
    requestPermission().then(granted => { if (granted) updateLocation(); });
  }, [requestPermission, updateLocation]);

  return { ...state, updateLocation, requestPermission };
}
