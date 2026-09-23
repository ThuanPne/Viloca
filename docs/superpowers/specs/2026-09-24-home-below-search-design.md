# Home Screen — Below Search Bar

**Date:** 2026-09-24  
**Branch:** feat/foster-tripUI  
**Scope:** Everything below the pill search bar on the Home screen (`app/(app)/index.tsx`)

---

## 1. Goal

Replace the current hardcoded category chips + image-only card grid on the home screen with a fully data-driven section that:
- Pulls categories from Supabase (`categories` table — to be created)
- Shows one featured location card (full-width hero) based on `is_featured` flag
- Shows a 2-column suggestion grid filtered by selected category
- Shows real driving distances via a Supabase Edge Function wrapping Google Routes API
- Never displays fake data; hides fields that are null/unavailable

---

## 2. Existing Codebase Constraints

- **Styling:** `StyleSheet` API (no NativeWind in home screen). New components follow same pattern.
- **Data fetching:** `useState` + `useEffect` + `supabase-js` direct calls. No React Query.
- **Image rendering:** `ImageBackground` / `Image` from `react-native`. `expo-image` is NOT installed — not adding it.
- **Supabase import path:** `@/src/lib/supabase` (not `@/lib/supabase` — old path used in some hooks, must fix when touching those files).
- **Favorites:** `user_favorites` table + `useFavorite(locationId)` hook already implements optimistic toggle.
- **Location detail route:** `/location/[id]` exists.
- **Explore route:** `/(app)/explore` exists — use as "Xem tất cả" target.
- **`photos` field:** comma-separated string. Parse: `photos?.split(',')[0]?.trim()`.
- **`coordinates` field:** JSONB `{ lat: number; lng: number }` or null.

---

## 3. Schema Changes

### 3a. `categories` table (new)

```sql
CREATE TABLE categories (
  id         SERIAL      PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  emoji      TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0
);

-- Seed (14 normalized categories from locations.category)
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
  ('Lưu trú',             '🏡', 14);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);
```

### 3b. `is_featured` on `locations` (new column)

```sql
ALTER TABLE locations
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_locations_featured ON locations (is_featured)
  WHERE is_featured = true;

-- Mark a handful of locations as featured (admin sets these manually or via seed)
-- No automated seed here — admin responsibility
```

---

## 4. Edge Function: `get-distances`

**Path:** `supabase/functions/get-distances/index.ts`

**Purpose:** Accept one origin + N destinations, call Google Routes API `computeRouteMatrix` in one request, return formatted distance strings. Keeps `GOOGLE_ROUTES_API_KEY` server-side only.

**Request body:**
```ts
{
  origin: { lat: number; lng: number };
  destinations: { id: string; lat: number; lng: number }[];
}
```

**Response body:**
```ts
{ id: string; label: string | null }[]
// label: "Cách 850 m" | "Cách 1.2 km" | null (on error or missing coords)
```

**Format rules:**
- `meters < 1000` → `"Cách {meters} m"` (rounded to nearest 50m)
- `meters >= 1000` → `"Cách {(meters/1000).toFixed(1)} km"`
- Any error or missing data → return `null` for that destination

**Auth:** Requires valid Supabase JWT (authenticated users only).

**Env var required:** `GOOGLE_ROUTES_API_KEY` (set in Supabase project secrets, not in `.env.local`).

---

## 5. New Hooks

### `useCategories()`
- Queries `categories` table, ordered by `sort_order`
- Returns `{ categories: Category[], loading: boolean }`

```ts
interface Category { id: number; name: string; emoji: string | null; sort_order: number }
```

### `useFeaturedLocation(category: string | null)`
- Queries `locations` where `is_featured = true AND is_active = true AND verified = true`
- If `category` is provided, also filters `category = category`; otherwise no category filter
- Returns first result only (`limit(1)`)
- Returns `{ location: Location | null, loading: boolean }`

### `useUserLocation()`
- Requests `Permissions.requestForegroundPermissionsAsync()`
- On granted: calls `getCurrentPositionAsync()` with accuracy `Balanced`
- Returns `{ coords: { latitude, longitude } | null, permissionDenied: boolean, loading: boolean }`
- Does NOT watch position — one-shot on mount

### `usePlaceDistances(placeCoords: { id: string; lat: number; lng: number }[], userCoords: { latitude: number; longitude: number } | null)`
- If `userCoords` is null → returns empty map immediately
- Calls Supabase Edge Function `get-distances` with all destinations in one request
- **Cache:** stores `{ userCoords, timestamp, result }` in a `useRef`. Re-fetches only when:
  - User has moved > 200m (Haversine calculation), **or**
  - > 5 minutes since last fetch
- Returns `Map<string, string | null>` (location id → label or null)

---

## 6. New Components

All in `src/components/home/`. StyleSheet only, no NativeWind.

### `CategoryChips`
```
Props: { selected: string | null; onSelect: (name: string) => void }
```
- `ScrollView` horizontal, `showsHorizontalScrollIndicator={false}`
- `paddingHorizontal: 16`, gap between chips: 10
- Each chip: `height: 40`, `borderRadius: 20`, `paddingHorizontal: 14`
- **Active:** `backgroundColor: colors.nomad.primary` (`#45611b`), text/emoji white, fontWeight `'700'`
- **Inactive:** `backgroundColor: '#fff'`, `borderWidth: 1`, `borderColor: '#E5E5E5'`, text `colors.nomad.onSurface`
- Data from `useCategories()` — show skeleton row (3 pill placeholders) while loading
- Default: selects `categories[0].name` on first load (call `onSelect` once via `useEffect`)

### `SectionHeader` (new, in `home/`)
```
Props: { title: string; subtitle?: string; onViewAll?: () => void }
```
- Row: title block on left, "Xem tất cả →" button on right (only if `onViewAll` provided)
- Title: `fontSize: 20`, `fontWeight: '800'`, `color: colors.nomad.onSurface`
- Subtitle: `fontSize: 13`, `color: colors.nomad.onSurfaceVariant`
- "Xem tất cả": `color: colors.nomad.primary`, `fontWeight: '700'`, `fontSize: 14`
- Note: existing `src/components/ui/SectionHeader.tsx` has a different interface — create new one in `home/` rather than modifying shared UI component

### `FeaturedPlaceCard`
```
Props: { location: Location; distanceLabel?: string | null }
```
- `marginHorizontal: 16`, `height: 230`, `borderRadius: 20`, `overflow: 'hidden'`
- Image source: first photo from `location.photos?.split(',')[0]?.trim()` → fallback to `location.cover_image`
- `ImageBackground` with `resizeMode="cover"` + `imageStyle={{ borderRadius: 20 }}`
- Gradient overlay: `LinearGradient` transparent → `rgba(0,0,0,0.72)` from 25% to 100%
- **Top-left badge:** pill `backgroundColor: colors.nomad.primary`, `'⭐ Nổi bật hôm nay'`, white text
- **Top-right:** circular button `width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff'`
  - Uses `useFavorite(location.id)` — heart icon red if favorite, outline if not
  - Optimistic via existing hook (no additional logic needed)
- **Bottom info (over gradient):**
  - Row 1: style tag pill (from `location.style_tag` — only if not null) + `★ {rating}` yellow + `({formatCount(review_count)})` white-muted
    - `rating` and `review_count`: `locations` table has `rating` (NUMERIC). No separate `review_count` column exists → **omit review count** (field doesn't exist; hide rather than fake)
  - Row 2: `location.name`, white, `fontSize: 22`, `fontWeight: '800'`
  - Row 3: `📍 {district}{city}` + if `distanceLabel` → ` • {distanceLabel}`, white, `fontSize: 13`
- **If `location.cover_image` and `photos` both null:** render LinearGradient fallback (nomad primary → container), still show text

### `PlaceGridCard`
```
Props: { location: Location; distanceLabel?: string | null }
```
- Card: `backgroundColor: '#fff'`, `borderRadius: 16`, `borderWidth: 1`, `borderColor: '#F0F0F0'`, shadow `elevation: 2`
- Image area: `aspectRatio: 4/3`, `overflow: 'hidden'`, `borderTopLeftRadius: 16`, `borderTopRightRadius: 16`
  - Badge top-left: `location.style_tag ?? location.category.split(',')[0]`, semi-transparent dark bg, white text `fontSize: 11`
- Body padding: 10
  - Name: `fontSize: 16`, `fontWeight: '700'`, `numberOfLines: 1`
  - Location row: `📍` icon + `[district], [city]` — hide if both null
  - Divider: `height: 1`, `backgroundColor: '#F5F5F5'`, `marginVertical: 8`
  - Bottom row: left `★ {rating}` green (only if rating not null); right `{distanceLabel}` grey (only if not null)
- `onPress` → `router.push('/location/' + location.id)`

---

## 7. Home Screen Changes (`app/(app)/index.tsx`)

Replace the section between the search bar and the festivals carousel with:

```
<CategoryChips selected={activeCategory} onSelect={setActiveCategory} />

<SectionHeader
  title="Dành riêng cho bạn"
  subtitle="Gợi ý phù hợp theo sở thích di sản"  
  onViewAll={() => router.push('/(app)/explore')}
/>

{/* Note: "Dành riêng cho bạn" currently filters by selected category.
    Personalization by user preferences is a future enhancement (no user_preferences table yet). */}

{featuredLocation && (
  <FeaturedPlaceCard
    location={featuredLocation}
    distanceLabel={distanceMap.get(featuredLocation.id)}
  />
)}

<FlatList / 2-column grid of PlaceGridCard />
```

- `activeCategory` state replaces existing hardcoded `CATEGORY_CHIPS` state
- Default: first category from `useCategories()` (set via `useEffect` when categories load)
- Suggestion grid: `useLocations(10, activeCategory)` excluding the featured location id
- Keep header, greeting card, search bar, festivals carousel **unchanged**
- `useUserLocation()` called once; coords fed into `usePlaceDistances()`
- If permission denied: show one-line prompt `"Bật định vị để xem khoảng cách 📍"` in muted text above grid, no distance labels

---

## 8. Missing Columns / Data Notes

| Need | Status | Action |
|------|--------|--------|
| `categories` table | Missing | Migration 2026-09-24-A |
| `locations.is_featured` | Missing | Migration 2026-09-24-B |
| `locations.review_count` | Missing | **Omit review count on UI** — `rating` exists but no count |
| User preferences table | Missing | Use category filter as proxy; note TODO in code |
| Google Routes API key | Missing | Must be set in Supabase project secrets as `GOOGLE_ROUTES_API_KEY` |

---

## 9. Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `GOOGLE_ROUTES_API_KEY` | Supabase project secrets | Used only in `get-distances` Edge Function |

Client `.env.local` needs no new variables — key never leaves the Edge Function.

---

## 10. Files Created / Modified

**New migrations:**
- `supabase/migrations/20260924000002_create_categories_table.sql`
- `supabase/migrations/20260924000003_add_is_featured_to_locations.sql`

**New Edge Function:**
- `supabase/functions/get-distances/index.ts`

**New hooks:**
- `src/hooks/useCategories.ts`
- `src/hooks/useFeaturedLocation.ts`
- `src/hooks/useUserLocation.ts`
- `src/hooks/usePlaceDistances.ts`

**New components:**
- `src/components/home/CategoryChips.tsx`
- `src/components/home/SectionHeader.tsx` (home-specific, different from `src/components/ui/SectionHeader.tsx`)
- `src/components/home/FeaturedPlaceCard.tsx`
- `src/components/home/PlaceGridCard.tsx`

**Modified:**
- `app/(app)/index.tsx` — replace below-search section, wire new hooks/components
