# Kế hoạch triển khai toàn bộ — Viloca

## Context

App du lịch Viloca đang hoạt động với luồng cơ bản: auth → tạo trip → AI plan-trip → timeline. Tuy nhiên hiệu quả AI bị giới hạn ở ~40% do 73 locations trong DB thiếu hoàn toàn các field quan trọng (vibes, rating, price_per_person, duration_minutes, coordinates, hint, cover_image — tất cả 0%). Ngoài ra, home screen và "Thêm địa điểm" vẫn dùng mock data. Kế hoạch này bao gồm 6 phase triển khai theo thứ tự ưu tiên.

---

## Phase 1 — Data Enrichment (CRITICAL PATH)

**Mục tiêu:** Điền đầy đủ các field thiếu cho 73 locations để AI hoạt động hiệu quả.

### 1a. Migration: vibes, price, duration, rating, description

Tạo `supabase/migrations/20260626000000_enrich_locations_fields.sql`:

```sql
-- Copy short_description → description (nguồn cho AI hint generation)
UPDATE locations SET description = short_description
WHERE description IS NULL AND short_description IS NOT NULL;

-- Gán vibes theo category (match đúng với VIBES trong workspace.tsx)
UPDATE locations SET vibes = ARRAY['Cổ kính','Văn hóa','Bình yên']
  WHERE category IN ('Di tích lịch sử','Bảo tàng','Làng nghề');
UPDATE locations SET vibes = ARRAY['Bình yên','Cổ kính']
  WHERE category = 'Di tích tín ngưỡng';
UPDATE locations SET vibes = ARRAY['Hoang sơ','Bình yên']
  WHERE category IN ('Thiên nhiên','Danh lam thắng cảnh','Du lịch sinh thái');
UPDATE locations SET vibes = ARRAY['Mạo hiểm','Văn hóa']
  WHERE category IN ('Trải nghiệm','Du lịch cộng đồng');
UPDATE locations SET vibes = ARRAY['Văn hóa']
  WHERE category IN ('Nghệ thuật','Văn hóa');
UPDATE locations SET vibes = ARRAY['Ẩm thực','Bình yên']
  WHERE category IN ('Ẩm thực','Café');
UPDATE locations SET vibes = ARRAY['Bình yên']
  WHERE category = 'Lưu trú';

-- Price per person (VND) theo category
UPDATE locations SET price_per_person = 30000
  WHERE category IN ('Di tích lịch sử','Di tích tín ngưỡng') AND price_per_person = 0;
UPDATE locations SET price_per_person = 50000
  WHERE category IN ('Bảo tàng','Văn hóa','Nghệ thuật') AND price_per_person = 0;
UPDATE locations SET price_per_person = 80000
  WHERE category IN ('Ẩm thực','Café') AND price_per_person = 0;
UPDATE locations SET price_per_person = 150000
  WHERE category IN ('Trải nghiệm','Du lịch cộng đồng','Làng nghề') AND price_per_person = 0;
UPDATE locations SET price_per_person = 50000
  WHERE category IN ('Thiên nhiên','Danh lam thắng cảnh','Du lịch sinh thái') AND price_per_person = 0;

-- Duration (phút) theo category
UPDATE locations SET duration_minutes = 90
  WHERE category IN ('Di tích lịch sử','Bảo tàng','Văn hóa','Nghệ thuật') AND duration_minutes = 120;
UPDATE locations SET duration_minutes = 60
  WHERE category IN ('Ẩm thực','Café') AND duration_minutes = 120;
UPDATE locations SET duration_minutes = 150
  WHERE category IN ('Thiên nhiên','Danh lam thắng cảnh','Du lịch sinh thái','Trải nghiệm') AND duration_minutes = 120;
UPDATE locations SET duration_minutes = 120
  WHERE category IN ('Du lịch cộng đồng','Làng nghề','Di tích tín ngưỡng') AND duration_minutes = 120;

-- Rating mặc định 4.0 (có thể cập nhật sau)
UPDATE locations SET rating = 4.0 WHERE rating IS NULL;

-- Cover image dùng picsum seed deterministic (không cần API)
UPDATE locations SET cover_image = 'https://picsum.photos/seed/loc-' || id || '/800/600'
WHERE cover_image IS NULL;
```

Apply: `npx supabase db push` hoặc qua Supabase Studio SQL editor.

### 1b. Edge Function: batch-generate-hints

Tạo `supabase/functions/batch-generate-hints/index.ts`:
- Fetch tất cả locations có `description IS NOT NULL` và `hint IS NULL`
- Với mỗi location: chạy prompt giống `generate-location-hint/index.ts` (gọi Claude Haiku)
- Batch 10 concurrent requests, sleep 1s giữa các batch để tránh rate limit
- Cần env var `ANTHROPIC_API_KEY` (đã có từ `generate-location-hint`)
- Deploy: `npx supabase functions deploy batch-generate-hints --project-ref ktwudhumkbhkxbbvacwl`
- Invoke 1 lần: `curl -X POST https://ktwudhumkbhkxbbvacwl.supabase.co/functions/v1/batch-generate-hints -H "Authorization: Bearer <service_role_key>"`

---

## Phase 2 — Improved AI Prompt + reason field

**Mục tiêu:** Nâng độ chính xác plan-trip từ ~40% lên ~80%+.

### 2a. Migration: thêm ai_reason vào trip_items

Tạo `supabase/migrations/20260626000001_add_ai_reason_to_trip_items.sql`:
```sql
ALTER TABLE public.trip_items ADD COLUMN IF NOT EXISTS ai_reason TEXT;
```

### 2b. Cập nhật `src/types/index.ts`

Thêm vào `TripItem`:
```typescript
ai_reason: string | null;
```

### 2c. Cập nhật `supabase/functions/plan-trip/index.ts`

**PlanRequest** — thêm optional fields:
```typescript
interface PlanRequest {
  // existing...
  traveling_with?: 'solo' | 'couple' | 'family' | 'friends';
  dietary_restrictions?: string[];
  must_include_ids?: string[];
  arrival_time?: string;    // "HH:MM"
  departure_time?: string;  // "HH:MM"
}
```

**Slot** — thêm reason:
```typescript
interface Slot {
  location_id: string;
  time_slot: string;
  reason?: string;
}
```

**COLS** — thêm district và coordinates:
```typescript
const COLS = 'id, name, category, vibes, price_per_person, duration_minutes, rating, hint, district, coordinates';
```

**locationMeta** — thêm district:
```typescript
const locationMeta = finalLocations!.map((l) => ({
  id: l.id, name: l.name, category: l.category,
  vibes: l.vibes, price_per_person: l.price_per_person,
  duration_minutes: l.duration_minutes, rating: l.rating,
  district: l.district,  // để AI nhóm địa điểm gần nhau
}));
```

**Prompt** — thay prompt hiện tại bằng phiên bản 9-nguyên-tắc:
- Nhóm địa điểm theo quận/huyện để tối ưu di chuyển
- Tôn trọng duration_minutes khi xếp slot
- Ngày 1 ưu tiên gần nơi lưu trú/trung tâm
- Ngày cuối tránh địa điểm xa, ưu tiên ẩm thực
- Không lặp địa điểm
- Tuân thủ budget nghiêm ngặt
- Yêu cầu `reason` trong output mỗi slot

**Output response** — include reason trong enriched:
```typescript
const enriched = plan.days.map((d) => ({
  day: d.day,
  slots: d.slots
    .filter((s) => hintMap.has(s.location_id))
    .map((s) => ({
      location_id: s.location_id,
      time_slot: s.time_slot,
      hint: hintMap.get(s.location_id) ?? null,
      reason: s.reason ?? null,
    })),
}));
```

Deploy: `npx supabase functions deploy plan-trip --project-ref ktwudhumkbhkxbbvacwl`

### 2d. Cập nhật `app/(app)/workspace.tsx` — lưu ai_reason

Trong `createWithAI`, khi build items array:
```typescript
const items = plan.days.flatMap((d) =>
  d.slots.map((s, i) => ({
    trip_id: trip.id,
    location_id: s.location_id,
    day_number: d.day,
    time_slot: slotMap[s.time_slot] ?? 'morning',
    note: s.hint ?? null,
    ai_reason: s.reason ?? null,
    sort_order: i,
  }))
);
```

Cùng logic trong `invokePlanTrip` ở `app/trip/[id].tsx`.

### 2e. Hiện ai_reason trong detail modal — `app/trip/[id].tsx`

Trong Item Detail Modal, sau phần "Ghi chú", thêm:
```tsx
{selectedItem.ai_reason && (
  <View style={styles.detailNoteBox}>
    <Text style={styles.detailNoteLabel}>Tại sao AI chọn?</Text>
    <Text style={styles.detailNoteText}>{selectedItem.ai_reason}</Text>
  </View>
)}
```

---

## Phase 3 — Workspace wizard: thêm traveling_with

**Mục tiêu:** Thu thêm context để AI lên kế hoạch phù hợp hơn.

File: `app/(app)/workspace.tsx`

Thêm state: `const [travelingWith, setTravelingWith] = useState('');`

Thêm UI ở Step 3a (trên vibes picker):
```tsx
const TRAVELING_WITH = [
  { label: 'Solo', value: 'solo' },
  { label: 'Cặp đôi', value: 'couple' },
  { label: 'Gia đình', value: 'family' },
  { label: 'Nhóm bạn', value: 'friends' },
];
// Render as chip row, single-select
```

Pass vào Edge Function call:
```typescript
traveling_with: travelingWith || undefined,
```

Reset trong `resetForm()`. Không cần required validation — field là optional.

---

## Phase 4 — Kết nối "Thêm địa điểm" với locations DB

**Mục tiêu:** Thay mock experiences bằng real locations từ Supabase.

File: `app/trip/[id].tsx`

### 4a. Fetch locations theo destination

Trong `openAddExp()`, fetch locations:
```typescript
const { data: locResults } = await supabase
  .from('locations')
  .select('id, name, category, hint, cover_image, price_per_person, district')
  .eq('is_active', true)
  .ilike('address', `%${trip.destination}%`);
setLocationPool(locResults ?? []);
```

State mới: `const [locationPool, setLocationPool] = useState<Location[]>([]);`

### 4b. Thay FlatList từ mockExperiences sang locationPool

Khi user chọn location từ pool:
```typescript
await supabase.from('trip_items').insert({
  trip_id: id,
  location_id: selectedLoc.id,
  day_number: addDay,
  time_slot: addSlot,
  visit_time: addTime || null,
  note: addNote.trim() || null,
  sort_order: 0,
});
```

### 4c. JOIN locations khi load trip_items

Thay query hiện tại (line 124):
```typescript
supabase.from('trip_items')
  .select('*, locations(name, category, hint, cover_image, district)')
  .eq('trip_id', id)
  .order('day_number').order('sort_order')
```

Cập nhật `TripItem` type để có optional `locations` join:
```typescript
locations?: {
  name: string;
  category: string;
  hint: string | null;
  cover_image: string | null;
  district: string | null;
} | null;
```

### 4d. Cập nhật display logic

Thay `isAIItem` logic hiện tại:
```typescript
const hasLocationId = !!item.location_id;
const locData = hasLocationId ? (item as any).locations : null;

const displayTitle = locData?.name ?? item.experience_title ?? 'Địa điểm bí ẩn';
const displayLocation = locData?.district ?? item.experience_location;
const hintText = (trip.is_ai_generated && hasLocationId) ? (locData?.hint ?? item.note) : null;
```

---

## Phase 5 — Home screen kết nối real data

**Mục tiêu:** Thay mock experiences trong home screen bằng locations từ DB.

### 5a. Tạo `src/hooks/useLocations.ts`

```typescript
export function useLocations(category?: string | null) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [featured, setFeatured] = useState<Location[]>([]);

  useEffect(() => {
    let q = supabase.from('locations_preview')
      .select('*').eq('is_active', true);
    if (category) q = q.eq('category', category);
    q.order('rating', { ascending: false }).limit(20)
     .then(({ data }) => {
       setLocations(data ?? []);
       setFeatured((data ?? []).filter(l => (l.rating ?? 0) >= 4.2).slice(0, 5));
     });
  }, [category]);

  return { locations, featured };
}
```

### 5b. Cập nhật `app/(app)/index.tsx`

- Thay `useExperiences` → `useLocations`
- Category filter dùng 14 Vietnamese categories (thay 4 mock categories)
- Card component mapping: `name` → title, `district` → location, `cover_image` → image

### 5c. Cập nhật `app/experience/[id].tsx`

Thay `mockExperiences.find((e) => e.id === id)` bằng Supabase query:
```typescript
const { data: loc } = await supabase
  .from('locations')
  .select('*')
  .eq('id', id)
  .single();
```

Adapt display UI cho Location type (thay guideName/guideAvatar bằng district + opening_hours).

---

## Verification

| Phase | Kiểm tra |
|-------|---------|
| 1a | `SELECT category, vibes, price_per_person, rating FROM locations LIMIT 5` → không còn null/0 |
| 1b | `SELECT COUNT(*) FROM locations WHERE hint IS NOT NULL` → 70+ |
| 1 E2E | Tạo AI trip Hà Nội → có địa điểm, không fallback tier 4 |
| 2 | Tạo trip → tap item → modal hiện "Tại sao AI chọn?" |
| 3 | Step 3a wizard có chip "Solo / Cặp đôi / Gia đình / Nhóm bạn" |
| 4 | FAB trip → modal hiện real locations, thêm được vào timeline |
| 5 | Home screen load từ Supabase, tap card → detail hiện đúng info |

---

## Thứ tự triển khai

```
Phase 1a (SQL migration)       → 30 phút — chạy ngay, unblock AI
Phase 1b (batch-hints fn)      → 45 phút — Edge Function mới
Phase 2  (improved prompt)     → 60 phút — plan-trip update + deploy
Phase 2a (ai_reason migration) → 10 phút — 1 ALTER TABLE
Phase 2b-e (reason in UI)      → 30 phút — workspace + trip detail
Phase 3  (traveling_with)      → 20 phút — workspace UI
Phase 4  (real locations add)  → 90 phút — trip/[id].tsx refactor
Phase 5  (home screen)         → 90 phút — new hook + screens
```

**Total ước tính: ~6.5 giờ** nếu triển khai tuần tự.
