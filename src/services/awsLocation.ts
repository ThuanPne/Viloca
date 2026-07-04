/**
 * AWS Location Service v2 — dùng fetch trực tiếp với API key trong URL.
 * Không cần SDK middleware, không cần Cognito.
 */

const REGION = process.env.EXPO_PUBLIC_AWS_REGION ?? 'ap-southeast-2';
const API_KEY = process.env.EXPO_PUBLIC_AWS_MAP_API_KEY ?? '';

const ROUTES_URL = `https://routes.geo.${REGION}.amazonaws.com/v2/routes?key=${API_KEY}`;
const GEOCODE_URL = `https://places.geo.${REGION}.amazonaws.com/v2/geocode?key=${API_KEY}`;

/**
 * MapLibre style descriptor URL.
 * MapLibre tự fetch URL này → lấy tile endpoints.
 * Style: Standard | Monochrome | Hybrid | Satellite
 */
export function getMapStyleUrl(style: MapStyleId = 'Standard'): string {
  return `https://maps.geo.${REGION}.amazonaws.com/v2/styles/${style}/descriptor?key=${API_KEY}`;
}

export type MapStyleId = 'Standard' | 'Monochrome' | 'Hybrid' | 'Satellite';

export const MAP_STYLES: { id: MapStyleId; label: string; icon: string }[] = [
  { id: 'Standard', label: 'Mặc định', icon: 'map-outline' },
  { id: 'Satellite', label: 'Vệ tinh', icon: 'planet-outline' },
  { id: 'Hybrid', label: 'Kết hợp', icon: 'layers-outline' },
  { id: 'Monochrome', label: 'Đơn sắc', icon: 'contrast-outline' },
];

const styleCache = new Map<string, object>();
const stylePromiseCache = new Map<string, Promise<object>>();

/**
 * Style descriptor JSON, cached trong bộ nhớ theo phiên app.
 * Tránh việc mỗi lần vào màn Map phải gọi lại AWS để lấy style descriptor
 * (nguồn gốc chính của cảm giác "load lại toàn bộ bản đồ" mỗi khi mở địa điểm mới).
 */
export async function getCachedMapStyle(style: MapStyleId = 'Standard'): Promise<object> {
  const cached = styleCache.get(style);
  if (cached) return cached;

  const pending = stylePromiseCache.get(style);
  if (pending) return pending;

  const promise = fetch(getMapStyleUrl(style))
    .then((res) => {
      if (!res.ok) throw new Error(`Style descriptor error: ${res.status}`);
      return res.json();
    })
    .then((json) => {
      styleCache.set(style, json);
      stylePromiseCache.delete(style);
      return json;
    })
    .catch((err) => {
      stylePromiseCache.delete(style);
      throw err;
    });

  stylePromiseCache.set(style, promise);
  return promise;
}

/**
 * Tính route lái xe từ A đến B.
 * Trả về mảng [lng, lat] pairs cho route polyline (GeoJSON order).
 */
export async function calculateRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<Array<[number, number]>> {
  const res = await fetch(ROUTES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Origin: [originLng, originLat],      // [lng, lat]
      Destination: [destLng, destLat],
      TravelMode: 'Car',
      LegGeometryFormat: 'Simple',
    }),
  });

  if (!res.ok) throw new Error(`Routes API error: ${res.status}`);

  const data = await res.json() as any;
  const legs: any[] = data.Routes?.[0]?.Legs ?? [];

  const coords: Array<[number, number]> = [];
  for (const leg of legs) {
    const points: [number, number][] = leg.Geometry?.LineString ?? [];
    for (const p of points) {
      coords.push([p[0], p[1]]); // already [lng, lat]
    }
  }
  return coords;
}

/** Khoảng cách thẳng (km) giữa 2 điểm — Haversine */
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format khoảng cách: "0.8 km" hoặc "250 m" */
export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Geocode địa chỉ → { lat, lng } — dùng trong geocode script */
export async function geocodeAddress(
  query: string,
  biasLng = 106.6297,
  biasLat = 10.8231,
): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(GEOCODE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      QueryText: query,
      BiasPosition: [biasLng, biasLat],
      MaxResults: 1,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json() as any;
  const point: [number, number] | undefined = data.ResultItems?.[0]?.Position;
  if (!point) return null;
  return { lat: point[1], lng: point[0] };
}
