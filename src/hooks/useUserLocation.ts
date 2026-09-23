import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface UserLocationResult {
  coords: { latitude: number; longitude: number } | null;
  permissionDenied: boolean;
  loading: boolean;
}

export function useUserLocation(): UserLocationResult {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelled) {
          setPermissionDenied(true);
          setLoading(false);
        }
        return;
      }

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } catch {
        // GPS unavailable — coords stays null, no error shown
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { coords, permissionDenied, loading };
}
