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

// Cache vị trí gần nhất trong bộ nhớ theo phiên app — các màn hình mở lại
// sau đó (vd. mở địa điểm khác rồi vào lại Map) hiển thị ngay thay vì chờ
// GPS fix mới, vốn có thể mất vài giây mỗi lần.
let cachedLocation: UserLocation | null = null;

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(cachedLocation);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(!cachedLocation);
    setError(null);
    try {
      // Fast path: vị trí hệ điều hành đã biết gần nhất — gần như tức thì.
      const last = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
      });
      if (last) {
        const loc = {
          lat: last.coords.latitude,
          lng: last.coords.longitude,
          accuracy: last.coords.accuracy,
        };
        cachedLocation = loc;
        setLocation(loc);
        setLoading(false);
      }

      // Làm mới bằng vị trí chính xác hơn (chạy nền, không chặn UI nếu đã có fast path).
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      cachedLocation = loc;
      setLocation(loc);
    } catch (err: any) {
      if (!cachedLocation) setError(err?.message ?? 'Không lấy được vị trí');
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
