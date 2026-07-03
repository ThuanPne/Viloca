import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
}

interface UseUserLocationResult {
  location: UserLocation | null;
  permissionStatus: Location.PermissionStatus | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Không lấy được vị trí');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === Location.PermissionStatus.GRANTED) {
        await fetchLocation();
      } else {
        setError('Vui lòng cấp quyền vị trí để sử dụng bản đồ');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchLocation]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      setPermissionStatus(status);
      if (status === Location.PermissionStatus.GRANTED) {
        await fetchLocation();
      }
    })();
    return () => { cancelled = true; };
  }, [fetchLocation]);

  return {
    location,
    permissionStatus,
    loading,
    error,
    requestPermission,
    refresh: fetchLocation,
  };
}
