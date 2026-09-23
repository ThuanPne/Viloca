# Home Below-Search Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded category chips + hero/small cards section on the Home screen with fully data-driven components: DB-backed category chips, a featured location hero card, and a 2-column suggestion grid — all with real distances via a Supabase Edge Function.

**Architecture:** Supabase is the sole data source. New migrations add `categories` table and `is_featured` column. Four new hooks handle data fetching. Four new components in `src/components/home/` render UI. `app/(app)/index.tsx` is modified only in the section between the search bar and the festivals carousel.

**Tech Stack:** React Native (StyleSheet, ScrollView, ImageBackground, LinearGradient), expo-location, Supabase JS v2, Supabase Edge Functions (Deno), Google Routes API

**Spec:** `docs/superpowers/specs/2026-09-24-home-below-search-design.md`

## Global Constraints

- Never hardcode location names, addresses, images, ratings, categories, or distances — all come from Supabase or live device/API calls
- Hide any field whose DB value is null/empty — never show a default like 0, "1.2 km", or "★ 4.5"
- Skeleton loading for all async states; empty state for no data; no mock data ever
- StyleSheet API only (no NativeWind) — matching the existing `app/(app)/index.tsx` style
- Import supabase from `@/src/lib/supabase` (default export) in all new hooks
- `useFavorite` lives at `@/src/hooks/useFavorite` — use as-is, do not change its imports
- Keep header, greeting card, search bar, festivals carousel, and "Phải ghé một lần" carousel untouched
- All new files: TypeScript strict mode; no `any`; explicit return types on hooks

## Review Focus

- **Permission denied + no coords:** `usePlaceDistances` receives `userCoords=null` — all distance labels must be absent (no "0 km" fallback)
- **`photos` is null AND `cover_image` is null:** `FeaturedPlaceCard` and `PlaceGridCard` must render without crashing (gradient fallback, no broken img)
- **No `is_featured` location in DB:** `useFeaturedLocation` returns null — `FeaturedPlaceCard` must not render at all
- **Odd number of grid items:** last row must not stretch a single card to full width — second slot stays empty
- **Category filter yields zero locations:** grid area shows an empty-state view, not a crash or blank scroll

---

## File Map

**New migrations:**
- `supabase/migrations/20260924000002_create_categories_table.sql`
- `supabase/migrations/20260924000003_add_is_featured_to_locations.sql`

**New Edge Function:**
- `supabase/functions/get-distances/index.ts`

**New hooks (all in `src/hooks/`):**
- `useCategories.ts`
- `useFeaturedLocation.ts`
- `useUserLocation.ts`
- `usePlaceDistances.ts`

**New components (all in `src/components/home/`):**
- `CategoryChips.tsx`
- `HomeSectionHeader.tsx`
- `FeaturedPlaceCard.tsx`
- `PlaceGridCard.tsx`

**Modified:**
- `src/types/index.ts` — add `Category` interface
- `app/(app)/index.tsx` — replace chips + featured section (lines ~23-345)

---

## Task 1: DB Migrations

**Files:**
- Create: `supabase/migrations/20260924000002_create_categories_table.sql`
- Create: `supabase/migrations/20260924000003_add_is_featured_to_locations.sql`

**Interfaces:**
- Produces: `categories` table (columns: `id SERIAL`, `name TEXT`, `emoji TEXT`, `sort_order INTEGER`)
- Produces: `locations.is_featured BOOLEAN NOT NULL DEFAULT false`

- [ ] **Step 1: Write categories migration**

```sql
-- supabase/migrations/20260924000002_create_categories_table.sql
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL      PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  emoji      TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0
);

INSERT INTO categories (name, emoji, sort_order) VALUES
  ('Ẩm thực',             '🍜', 1),
  ('Café',                '☕', 2),
  ('Di tích lịch sử',     '🏛️', 3),
  ('Bảo tàng',            '🖼️', 4),
  ('Di tích tín ngưỡng',  '🕌', 5),
  ('Văn hóa',             '🎭', 6),
  ('Nghệ thuật',          '🎨', 7),
  ('Thiên nhiên',         '🌿', 8),
  ('Danh lam thắng cảnh', '⛰️', 9),
  ('Du lịch sinh thái',   '🌱', 10),
  ('Du lịch cộng đồng',   '🤝', 11),
  ('Làng nghề',           '🏺', 12),
  ('Trải nghiệm',         '🎒', 13),
  ('Lưu trú',             '🏡', 14)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_categories"
  ON categories FOR SELECT
  USING (true);
```

- [ ] **Step 2: Write is_featured migration**

```sql
-- supabase/migrations/20260924000003_add_is_featured_to_locations.sql
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_locations_featured
  ON locations (is_featured)
  WHERE is_featured = true;
```

- [ ] **Step 3: Apply to local Supabase (or note for remote)**

If running local Supabase:
```bash
npx supabase db push
```
If applying to hosted project directly, run each SQL file in Supabase Dashboard → SQL editor.

After applying, mark at least one `location` as featured so Task 3 can be verified:
```sql
UPDATE locations SET is_featured = true
WHERE id = (SELECT id FROM locations WHERE is_active = true AND verified = true LIMIT 1);
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260924000002_create_categories_table.sql \
        supabase/migrations/20260924000003_add_is_featured_to_locations.sql
git commit -m "feat: add categories table and is_featured column to locations

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: TypeScript Type + useCategories + useFeaturedLocation Hooks

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/hooks/useCategories.ts`
- Create: `src/hooks/useFeaturedLocation.ts`

**Interfaces:**
- Produces: `Category` interface exported from `src/types/index.ts`
- Produces: `useCategories(): { categories: Category[]; loading: boolean }`
- Produces: `useFeaturedLocation(category: string | null): { location: Location | null; loading: boolean }`

- [ ] **Step 1: Add Category type to `src/types/index.ts`**

Open `src/types/index.ts` and add after the `Location` interface:

```ts
export interface Category {
  id: number;
  name: string;
  emoji: string | null;
  sort_order: number;
}
```

Also verify `Location` has `is_featured` — it does not yet. Add to the `Location` interface after `verified`:

```ts
  is_featured: boolean;
```

- [ ] **Step 2: Write useCategories hook**

```ts
// src/hooks/useCategories.ts
import { useState, useEffect } from 'react';
import supabase from '@/src/lib/supabase';
import type { Category } from '@/src/types';

export function useCategories(): { categories: Category[]; loading: boolean } {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, emoji, sort_order')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setCategories(data as Category[]);
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}
```

- [ ] **Step 3: Write useFeaturedLocation hook**

```ts
// src/hooks/useFeaturedLocation.ts
import { useState, useEffect } from 'react';
import supabase from '@/src/lib/supabase';
import type { Location } from '@/src/types';

export function useFeaturedLocation(
  category: string | null
): { location: Location | null; loading: boolean } {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let query = supabase
      .from('locations')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .eq('verified', true);

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    query.limit(1).maybeSingle().then(({ data, error }) => {
      setLocation(!error && data ? (data as Location) : null);
      setLoading(false);
    });
  }, [category]);

  return { location, loading };
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors. If `is_featured` is flagged as missing from existing Location usage, verify the column was added in Step 1.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/hooks/useCategories.ts src/hooks/useFeaturedLocation.ts
git commit -m "feat: add Category type and useCategories/useFeaturedLocation hooks

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: useUserLocation Hook

**Files:**
- Create: `src/hooks/useUserLocation.ts`

**Interfaces:**
- Produces:
```ts
useUserLocation(): {
  coords: { latitude: number; longitude: number } | null;
  permissionDenied: boolean;
  loading: boolean;
}
```

- [ ] **Step 1: Write the hook**

```ts
// src/hooks/useUserLocation.ts
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUserLocation.ts
git commit -m "feat: add useUserLocation hook with permission handling

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Edge Function `get-distances` + usePlaceDistances Hook

**Files:**
- Create: `supabase/functions/get-distances/index.ts`
- Create: `src/hooks/usePlaceDistances.ts`

**Interfaces:**
- Edge Function request: `{ origin: { lat: number; lng: number }; destinations: { id: string; lat: number; lng: number }[] }`
- Edge Function response: `{ id: string; label: string | null }[]`
- Produces:
```ts
usePlaceDistances(
  placeCoords: { id: string; lat: number; lng: number }[],
  userCoords: { latitude: number; longitude: number } | null
): Map<string, string | null>
```

- [ ] **Step 1: Write Edge Function**

```ts
// supabase/functions/get-distances/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Destination { id: string; lat: number; lng: number }
interface RequestBody {
  origin: { lat: number; lng: number };
  destinations: Destination[];
}
interface DistanceResult { id: string; label: string | null }

function formatDistance(meters: number): string {
  if (meters < 1000) {
    const rounded = Math.round(meters / 50) * 50;
    return `Cách ${rounded} m`;
  }
  return `Cách ${(meters / 1000).toFixed(1)} km`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Verify JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  const { error: authError } = await supabaseClient.auth.getUser();
  if (authError) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const body: RequestBody = await req.json();
  const { origin, destinations } = body;

  if (!destinations || destinations.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('GOOGLE_ROUTES_API_KEY');
  if (!apiKey) {
    const nullResults: DistanceResult[] = destinations.map((d) => ({ id: d.id, label: null }));
    return new Response(JSON.stringify(nullResults), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const routeMatrixBody = {
      origins: [{ waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } } }],
      destinations: destinations.map((d) => ({
        waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
      })),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
    };

    const response = await fetch(
      `https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,status' },
        body: JSON.stringify(routeMatrixBody),
      }
    );

    if (!response.ok) {
      const nullResults: DistanceResult[] = destinations.map((d) => ({ id: d.id, label: null }));
      return new Response(JSON.stringify(nullResults), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const rows: { originIndex: number; destinationIndex: number; distanceMeters?: number; status?: string }[] =
      await response.json();

    const results: DistanceResult[] = destinations.map((dest, idx) => {
      const row = rows.find((r) => r.destinationIndex === idx && r.originIndex === 0);
      if (!row || row.status !== 'OK' || row.distanceMeters == null) {
        return { id: dest.id, label: null };
      }
      return { id: dest.id, label: formatDistance(row.distanceMeters) };
    });

    return new Response(JSON.stringify(results), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch {
    const nullResults: DistanceResult[] = destinations.map((d) => ({ id: d.id, label: null }));
    return new Response(JSON.stringify(nullResults), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Write usePlaceDistances hook**

```ts
// src/hooks/usePlaceDistances.ts
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
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
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
```

- [ ] **Step 3: Set Edge Function secret (document only)**

The `GOOGLE_ROUTES_API_KEY` must be set in Supabase project secrets, not in `.env.local`:
```bash
npx supabase secrets set GOOGLE_ROUTES_API_KEY=<your-key>
```
Until this key is set, all distance labels will be `null` (hidden on UI) — acceptable fallback.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/get-distances/index.ts src/hooks/usePlaceDistances.ts
git commit -m "feat: add get-distances edge function and usePlaceDistances hook

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: CategoryChips Component

**Files:**
- Create: `src/components/home/CategoryChips.tsx`

**Interfaces:**
- Consumes: `useCategories()` from `src/hooks/useCategories`
- Props: `{ selected: string | null; onSelect: (name: string) => void }`

- [ ] **Step 1: Write component**

```tsx
// src/components/home/CategoryChips.tsx
import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useCategories } from '@/src/hooks/useCategories';
import { colors } from '@/src/theme/colors';

interface Props {
  selected: string | null;
  onSelect: (name: string) => void;
}

// Skeleton pill for loading state
function ChipSkeleton() {
  return <View style={styles.skeleton} />;
}

export function CategoryChips({ selected, onSelect }: Props) {
  const { categories, loading } = useCategories();

  // Auto-select first category once loaded
  useEffect(() => {
    if (!loading && categories.length > 0 && selected === null) {
      onSelect(categories[0].name);
    }
  }, [loading, categories, selected, onSelect]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {loading
        ? [1, 2, 3].map((k) => <ChipSkeleton key={k} />)
        : categories.map((cat) => {
            const active = selected === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
                onPress={() => onSelect(cat.name)}
              >
                {cat.emoji ? (
                  <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                ) : null}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { marginBottom: 20 },
  content: { paddingHorizontal: 16, gap: 10, paddingVertical: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 40, borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E5E5',
  },
  chipActive: {
    backgroundColor: colors.nomad.primary,
    borderColor: colors.nomad.primary,
  },
  chipEmoji: { fontSize: 15 },
  chipText: { fontSize: 14, color: colors.nomad.onSurface, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  skeleton: {
    width: 90, height: 40, borderRadius: 20,
    backgroundColor: '#E8E8E8', opacity: 0.6,
  },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/home/CategoryChips.tsx
git commit -m "feat: add CategoryChips component with DB-driven categories

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: HomeSectionHeader Component

**Files:**
- Create: `src/components/home/HomeSectionHeader.tsx`

**Interfaces:**
- Props: `{ title: string; subtitle?: string; onViewAll?: () => void }`
- Note: named `HomeSectionHeader` (not `SectionHeader`) to avoid collision with `src/components/ui/SectionHeader.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/components/home/HomeSectionHeader.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

interface Props {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
}

export function HomeSectionHeader({ title, subtitle, onViewAll }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onViewAll ? (
        <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.nomad.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },
  left:        { flex: 1, marginRight: 8 },
  title:       { fontSize: 20, fontWeight: '800', color: colors.nomad.onSurface, lineHeight: 26 },
  subtitle:    { fontSize: 13, color: colors.nomad.onSurfaceVariant, marginTop: 2 },
  viewAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 14, fontWeight: '700', color: colors.nomad.primary },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HomeSectionHeader.tsx
git commit -m "feat: add HomeSectionHeader component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: FeaturedPlaceCard Component

**Files:**
- Create: `src/components/home/FeaturedPlaceCard.tsx`

**Interfaces:**
- Consumes: `useFavorite(locationId)` from `@/src/hooks/useFavorite`
- Props: `{ location: Location; distanceLabel?: string | null }`

- [ ] **Step 1: Write component**

```tsx
// src/components/home/FeaturedPlaceCard.tsx
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFavorite } from '@/src/hooks/useFavorite';
import { colors } from '@/src/theme/colors';
import type { Location } from '@/src/types';

interface Props {
  location: Location;
  distanceLabel?: string | null;
}

export function FeaturedPlaceCard({ location, distanceLabel }: Props) {
  const { isFavorite, toggle } = useFavorite(location.id);
  const firstPhoto = location.photos?.split(',')[0]?.trim() ?? location.cover_image ?? undefined;
  const subtitle = [location.district, location.city === 'SG' ? 'TP. HCM' : location.city === 'HN' ? 'Hà Nội' : location.city === 'DN' ? 'Đà Nẵng' : location.city]
    .filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/location/${location.id}`)}
    >
      <ImageBackground
        source={firstPhoto ? { uri: firstPhoto } : undefined}
        style={styles.image}
        resizeMode="cover"
        imageStyle={{ borderRadius: 20 }}
      >
        {/* Fallback gradient when no image */}
        {!firstPhoto && (
          <LinearGradient
            colors={[colors.nomad.primaryContainer, colors.nomad.primary]}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Dark gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          locations={[0.25, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐ Nổi bật hôm nay</Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={(e) => { e.stopPropagation(); toggle(); }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#FF4D6D' : colors.nomad.onSurface}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom info */}
        <View style={styles.info}>
          {/* Row 1: tag + rating */}
          <View style={styles.metaRow}>
            {location.style_tag ? (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{location.style_tag}</Text>
              </View>
            ) : null}
            {location.rating != null ? (
              <Text style={styles.rating}>★ {location.rating}</Text>
            ) : null}
          </View>

          {/* Row 2: name */}
          <Text style={styles.name} numberOfLines={2}>{location.name}</Text>

          {/* Row 3: address + distance */}
          {(subtitle || distanceLabel) ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.address} numberOfLines={1}>
                {[subtitle, distanceLabel].filter(Boolean).join(' • ')}
              </Text>
            </View>
          ) : null}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:         { marginHorizontal: 16, marginBottom: 16, height: 230, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
  image:        { flex: 1 },
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  featuredBadge:{ backgroundColor: colors.nomad.primary, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  featuredBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  favoriteBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  info:         { padding: 14, paddingTop: 0 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tagPill:      { backgroundColor: 'rgba(220,240,180,0.25)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  tagText:      { color: colors.nomad.onPrimaryContainer, fontSize: 12, fontWeight: '600' },
  rating:       { color: '#FFD700', fontSize: 13, fontWeight: '700' },
  name:         { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 6 },
  addressRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address:      { color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1 },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/home/FeaturedPlaceCard.tsx
git commit -m "feat: add FeaturedPlaceCard with optimistic favorite toggle

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: PlaceGridCard Component

**Files:**
- Create: `src/components/home/PlaceGridCard.tsx`

**Interfaces:**
- Props: `{ location: Location; distanceLabel?: string | null; width: number }`

- [ ] **Step 1: Write component**

```tsx
// src/components/home/PlaceGridCard.tsx
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/src/theme/colors';
import type { Location } from '@/src/types';

interface Props {
  location: Location;
  distanceLabel?: string | null;
  width: number;
}

export function PlaceGridCard({ location, distanceLabel, width }: Props) {
  const firstPhoto = location.photos?.split(',')[0]?.trim() ?? location.cover_image ?? undefined;
  const badgeLabel = location.style_tag ?? location.category?.split(',')[0]?.trim() ?? null;
  const addressParts = [location.district, location.city === 'SG' ? 'TP. HCM' : location.city === 'HN' ? 'Hà Nội' : location.city === 'DN' ? 'Đà Nẵng' : location.city].filter(Boolean);
  const imageHeight = Math.round((width * 3) / 4); // 4:3 ratio

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      activeOpacity={0.88}
      onPress={() => router.push(`/location/${location.id}`)}
    >
      {/* Image */}
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        {firstPhoto ? (
          <Image source={{ uri: firstPhoto }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imageFallback, { height: imageHeight }]} />
        )}
        {badgeLabel ? (
          <View style={styles.imageBadge}>
            <Text style={styles.imageBadgeText} numberOfLines={1}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{location.name}</Text>

        {addressParts.length > 0 ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color={colors.nomad.onSurfaceVariant} />
            <Text style={styles.locationText} numberOfLines={1}>
              {addressParts.join(', ')}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          {location.rating != null ? (
            <Text style={styles.ratingText}>★ {location.rating}</Text>
          ) : <View />}
          {distanceLabel ? (
            <Text style={styles.distanceText}>{distanceLabel}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:         { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  imageWrap:    { position: 'relative', overflow: 'hidden' },
  image:        { width: '100%', height: '100%' },
  imageFallback:{ width: '100%', backgroundColor: colors.nomad.surfaceContainer },
  imageBadge:   { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, maxWidth: '80%' },
  imageBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  body:         { padding: 10 },
  name:         { fontSize: 16, fontWeight: '700', color: colors.nomad.onSurface, marginBottom: 5 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  locationText: { fontSize: 12, color: colors.nomad.onSurfaceVariant, flex: 1 },
  divider:      { height: 1, backgroundColor: '#F5F5F5', marginVertical: 8 },
  bottomRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingText:   { fontSize: 13, color: colors.nomad.primary, fontWeight: '700' },
  distanceText: { fontSize: 12, color: colors.nomad.onSurfaceVariant },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/home/PlaceGridCard.tsx
git commit -m "feat: add PlaceGridCard 2-column card component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Wire up `app/(app)/index.tsx`

**Files:**
- Modify: `app/(app)/index.tsx`

**Interfaces:**
- Consumes all new hooks and components from Tasks 2–8
- Retains: header, greeting card, search bar, festivals section, "Phải ghé một lần" carousel, FilterSheet

- [ ] **Step 1: Replace imports at the top of `app/(app)/index.tsx`**

Remove the line:
```ts
const CATEGORY_CHIPS = [ ... ];  // the entire hardcoded array
```

Add these imports (after existing ones):
```ts
import { CategoryChips } from '@/src/components/home/CategoryChips';
import { HomeSectionHeader } from '@/src/components/home/HomeSectionHeader';
import { FeaturedPlaceCard } from '@/src/components/home/FeaturedPlaceCard';
import { PlaceGridCard } from '@/src/components/home/PlaceGridCard';
import { useFeaturedLocation } from '@/src/hooks/useFeaturedLocation';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import { usePlaceDistances } from '@/src/hooks/usePlaceDistances';
```

- [ ] **Step 2: Replace hook calls in `HomeScreen()`**

Remove:
```ts
const { locations: featured } = useLocations(3);
```

Add after the existing `useLocations` call:
```ts
const { location: featuredLocation } = useFeaturedLocation(activeCategory);
const { coords: userCoords, permissionDenied } = useUserLocation();

// Build coords list for distance calculation (featured + grid)
const gridLocations = locations.filter((l) => l.id !== featuredLocation?.id);
const allCoordsForDistance = [
  ...(featuredLocation?.coordinates ? [{ id: featuredLocation.id, lat: featuredLocation.coordinates.lat, lng: featuredLocation.coordinates.lng }] : []),
  ...gridLocations
    .filter((l) => l.coordinates != null)
    .map((l) => ({ id: l.id, lat: l.coordinates!.lat, lng: l.coordinates!.lng })),
];
const distanceMap = usePlaceDistances(allCoordsForDistance, userCoords);
```

Remove:
```ts
const [hero, ...rest] = featured;
const smallCards = rest.slice(0, 2);
```

Change `activeCategory` initial state from `null` to `null` (no change needed — `CategoryChips` will auto-select first on load).

Change `useLocations(5, activeCategory)` to `useLocations(10, activeCategory)` for more grid items.

Calculate card width:
```ts
const CARD_WIDTH = Math.floor((SCREEN_W - 16 - 16 - 12) / 2); // 16 left + 16 right padding + 12 gap
```

- [ ] **Step 3: Replace the section between search bar and festivals in the JSX**

Remove this block (from `{/* Category chips */}` through `</View>{/* featuredWrap */}`):
```jsx
{/* Category chips */}
<ScrollView ... >
  {CATEGORY_CHIPS.map(...)}
</ScrollView>

{/* ── Dành cho bạn ── */}
<View style={styles.sectionHeader}>...</View>

<View style={styles.featuredWrap}>
  {hero && <HeroCard location={hero} />}
  {smallCards.length > 0 && ...}
</View>
```

Replace with:
```jsx
{/* ── Category chips ── */}
<CategoryChips
  selected={activeCategory}
  onSelect={setActiveCategory}
/>

{/* ── Dành riêng cho bạn ── */}
<HomeSectionHeader
  title="Dành riêng cho bạn"
  subtitle="Gợi ý phù hợp theo sở thích di sản"
  onViewAll={() => router.push('/(app)/explore')}
/>

{/* Location hint when permission denied */}
{permissionDenied && (
  <Text style={styles.locationHint}>
    📍 Bật định vị để xem khoảng cách đến từng nơi
  </Text>
)}

{/* Featured card */}
{featuredLocation && (
  <FeaturedPlaceCard
    location={featuredLocation}
    distanceLabel={distanceMap.get(featuredLocation.id)}
  />
)}

{/* 2-column grid */}
{locationsLoading ? (
  <ActivityIndicator color={colors.nomad.primary} style={{ marginVertical: 24 }} />
) : gridLocations.length === 0 ? (
  <Text style={styles.emptyText}>Không có địa điểm nào trong danh mục này</Text>
) : (
  <View style={styles.grid}>
    {gridLocations.map((loc) => (
      <PlaceGridCard
        key={loc.id}
        location={loc}
        distanceLabel={distanceMap.get(loc.id)}
        width={CARD_WIDTH}
      />
    ))}
  </View>
)}
```

- [ ] **Step 4: Add new styles to `StyleSheet.create()`**

Add inside the existing `styles` object:
```ts
locationHint:  { fontSize: 12, color: colors.nomad.onSurfaceVariant, textAlign: 'center', marginHorizontal: 16, marginBottom: 12 },
grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginBottom: 24 },
```

Remove unused styles: `chipsScroll`, `categoryChip`, `categoryChipActive`, `categoryChipText`, `categoryChipTextActive`, `featuredWrap`, `smallRow` (if they exist and are no longer used).

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```
Resolve any errors before continuing.

- [ ] **Step 6: Manual verification**

Start the dev server:
```bash
npx expo start --android
```

Check:
- [ ] Category chips load from DB (not hardcoded), first chip is auto-selected
- [ ] Changing chip filters the grid below
- [ ] Featured card appears (if a location has `is_featured=true`)
- [ ] Heart button on featured card toggles red/outline and persists after reload
- [ ] Grid shows 2 columns with equal-width cards
- [ ] Cards without images show a grey fallback (not a crash)
- [ ] Distance labels appear only if GPS granted AND API key set
- [ ] "Bật định vị" hint shows when location permission is denied
- [ ] Tapping any card navigates to `/location/[id]`
- [ ] "Xem tất cả" navigates to explore screen
- [ ] Header, greeting card, search bar, festivals, and "Phải ghé" carousel are unchanged

- [ ] **Step 7: Commit**

```bash
git add app/(app)/index.tsx
git commit -m "feat: wire up DB-driven home section with featured card and suggestion grid

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Summary

| Task | Deliverable |
|------|-------------|
| 1 | `categories` table + `is_featured` column migrations |
| 2 | `Category` type, `useCategories`, `useFeaturedLocation` |
| 3 | `useUserLocation` (expo-location, permission handling) |
| 4 | `get-distances` Edge Function + `usePlaceDistances` (cached) |
| 5 | `CategoryChips` component |
| 6 | `HomeSectionHeader` component |
| 7 | `FeaturedPlaceCard` with favorite toggle |
| 8 | `PlaceGridCard` 2-column card |
| 9 | Home screen wired end-to-end |

**Env var to set in Supabase secrets:** `GOOGLE_ROUTES_API_KEY`  
**DB action needed after migrations:** Mark at least one location as `is_featured=true` in Supabase Dashboard.
