import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '@/src/lib/supabase';
import { sendNearbyLocationNotification } from '@/src/services/notifications';

export const DWELL_TASK_NAME = 'VILOCA_DWELL_DETECTION';

const DWELL_RADIUS_KM = 0.5;
const DWELL_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = '@viloca/dwell_state';
const NOTIFIED_KEY = '@viloca/dwell_notified_ids';

interface DwellState {
  anchorLat: number;
  anchorLng: number;
  anchorTimestamp: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

async function getDwellState(): Promise<DwellState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setDwellState(state: DwellState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function resetDwellState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await AsyncStorage.removeItem(NOTIFIED_KEY);
}

async function getNotifiedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function addNotifiedIds(ids: string[]): Promise<void> {
  const existing = await getNotifiedIds();
  const merged = Array.from(new Set([...existing, ...ids]));
  await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(merged));
}

async function triggerNearbySuggestion(lat: number, lng: number): Promise<void> {
  const notifiedIds = await getNotifiedIds();

  const { data: locations, error } = await supabase.rpc('nearby_locations', {
    user_lat: lat,
    user_lng: lng,
    radius_km: DWELL_RADIUS_KM,
    excluded_ids: notifiedIds,
  });

  if (error || !locations?.length) return;

  const names = locations.slice(0, 2).map((l: { name: string }) => l.name);
  const ids = locations.map((l: { id: string }) => l.id);

  await sendNearbyLocationNotification(names);
  await addNotifiedIds(ids);
}

// Task must be defined at module top level (before any async code runs)
TaskManager.defineTask(DWELL_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn('[DwellTask] error:', error);
    return;
  }

  const locations = (data as any)?.locations as Location.LocationObject[] | undefined;
  if (!locations?.length) return;

  const { latitude: lat, longitude: lng } = locations[locations.length - 1].coords;
  const now = Date.now();

  const state = await getDwellState();

  if (!state) {
    // First reading — set anchor
    await setDwellState({ anchorLat: lat, anchorLng: lng, anchorTimestamp: now });
    return;
  }

  const distFromAnchor = haversineKm(lat, lng, state.anchorLat, state.anchorLng);

  if (distFromAnchor > DWELL_RADIUS_KM) {
    // User moved — reset anchor
    await resetDwellState();
    await setDwellState({ anchorLat: lat, anchorLng: lng, anchorTimestamp: now });
    return;
  }

  const dwellDuration = now - state.anchorTimestamp;
  if (dwellDuration >= DWELL_DURATION_MS) {
    await triggerNearbySuggestion(lat, lng);
    // Reset so we don't spam — next trigger after another 10 min of staying
    await setDwellState({ ...state, anchorTimestamp: now });
  }
});

/** Start background location updates for dwell detection. */
export async function startDwellTracking(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(DWELL_TASK_NAME);
  if (isRegistered) return;

  await Location.startLocationUpdatesAsync(DWELL_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 2 * 60 * 1000, // every 2 minutes
    distanceInterval: 100,        // or when moved 100m
    foregroundService: {
      notificationTitle: 'Viloca đang theo dõi vị trí',
      notificationBody: 'Để gợi ý địa điểm thú vị gần bạn',
      notificationColor: '#45611b',
    },
    pausesUpdatesAutomatically: false,
  });
}

/** Stop background location updates. */
export async function stopDwellTracking(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(DWELL_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(DWELL_TASK_NAME);
  }
  await resetDwellState();
}
