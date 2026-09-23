import { useState, useEffect, useRef } from 'react';
import supabase from '@/src/lib/supabase';

interface PlaceCoord { id: string; lat: number; lng: number }
interface UserCoords { latitude: number; longitude: number }
interface CacheEntry {
  userCoords: UserCoords;
  timestamp: number;
  result: Map<string, string | null>;
}

const DISTANCE_THRESHOLD_M = 200;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function haversineMeters(a: UserCoords, b: UserCoords): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function usePlaceDistances(
  placeCoords: PlaceCoord[],
  userCoords: UserCoords | null
): Map<string, string | null> {
  const [distanceMap, setDistanceMap] = useState<Map<string, string | null>>(new Map());
  const cache = useRef<CacheEntry | null>(null);

  useEffect(() => {
    if (!userCoords || placeCoords.length === 0) {
      setDistanceMap(new Map());
      return;
    }

    const now = Date.now();
    const cached = cache.current;

    if (cached) {
      const moved = haversineMeters(cached.userCoords, userCoords);
      const stale = now - cached.timestamp > CACHE_TTL_MS;
      if (!stale && moved < DISTANCE_THRESHOLD_M) {
        setDistanceMap(cached.result);
        return;
      }
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-distances', {
          body: {
            origin: { lat: userCoords.latitude, lng: userCoords.longitude },
            destinations: placeCoords,
          },
        });

        if (error || !Array.isArray(data)) {
          setDistanceMap(new Map(placeCoords.map((p) => [p.id, null])));
          return;
        }

        const result = new Map<string, string | null>(
          (data as { id: string; label: string | null }[]).map((r) => [r.id, r.label])
        );
        cache.current = { userCoords, timestamp: Date.now(), result };
        setDistanceMap(result);
      } catch {
        setDistanceMap(new Map(placeCoords.map((p) => [p.id, null])));
      }
    })();
  }, [placeCoords, userCoords]);

  return distanceMap;
}
