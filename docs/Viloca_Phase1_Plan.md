# Viloca — Feature Plan Phase 1

> Travel Planning App · Version 1.0 · Tháng 6/2026

---

## 1. Tổng quan dự án

Viloca là ứng dụng du lịch dành cho người dùng Việt Nam, tập trung vào ba trải nghiệm cốt lõi:
- **Khám phá** — tìm kiếm địa điểm, trải nghiệm theo phong cách cá nhân
- **Lên kế hoạch** — tạo lịch trình theo ngày, quản lý ngân sách và hành lý
- **Lưu giữ kỷ niệm** — viết nhật ký, đánh dấu địa điểm đã đi

### Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Framework | Expo SDK 56 · React Native 0.85 |
| Ngôn ngữ | TypeScript (strict mode) |
| Routing | expo-router (file-based) |
| Styling | NativeWind v4 (Tailwind CSS) |
| Animation | React Native Reanimated 2 |
| State | Zustand (auth) + React hooks (local) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Icons | @expo/vector-icons · Ionicons |

### Navigation (3 tab → 4 tab)

| Tab | File | Icon | Mô tả |
|---|---|---|---|
| Home | `app/(app)/index.tsx` (rewrite) | `home-outline` | Dashboard cá nhân |
| Khám phá | `app/(app)/explore.tsx` | `compass-outline` | Browse + search + filter |
| Chuyến đi | `app/(app)/workspace.tsx` | `map-outline` | Danh sách trips |
| Hồ sơ | `app/(app)/profile/index.tsx` | `person-outline` | Stats, bookmark, settings |

---

## 2. Feature Roadmap

### Phase 1 — Quick Wins (đang triển khai)

| # | Tính năng | Impact | Effort |
|---|---|---|---|
| 1.1 | Home Screen Dashboard | Cao | Medium |
| 1.2 | Search + Filter | Cao | Thấp |
| 1.3 | Wishlist / Bookmark | Cao | Thấp |
| 1.4 | Packing List | Cao | Thấp |

### Phase 2 — Core Differentiators

| # | Tính năng | Impact | Effort |
|---|---|---|---|
| 2.1 | Budget Management | Rất cao | Medium |
| 2.2 | Weather Widget | Medium | Thấp |
| 2.3 | Map View | Cao | Cao |
| 2.4 | Trip Lifecycle + Completion Screen | Medium | Medium |
| 2.5 | Travel Style Quiz (Onboarding) | Cao | Thấp |

### Phase 3 — Retention & Growth

| # | Tính năng | Cơ chế thu hút |
|---|---|---|
| 3.1 | Province Heat Map | Gamification — collect 63 tỉnh |
| 3.2 | Travel Challenges + Badges | Identity reinforcement |
| 3.3 | Photo Spot Finder | Gen Z hook — content creation |
| 3.4 | Share Trip Public Link ⭐ | Viral loop — acquisition engine |
| 3.5 | "On This Day" Memory Cards | Nostalgia trigger |
| 3.6 | Group Trip Planning | Network effect + social obligation |

### Phase 4 — Tương lai

| Tính năng | Lý do defer |
|---|---|
| AI Travel Assistant / Chatbot | Cần LLM API + cost + moderation |
| Route Optimization | Cần Maps API, build sau khi Map View ổn định |
| Trip Countdown (giờ/phút) | Sau khi Home Dashboard hoàn thiện |

### Loại bỏ hoàn toàn

| Tính năng | Lý do |
|---|---|
| Auto Trip Recap Video | Video processing pipeline — ngoài tầm mobile team |
| Travel Buddy Matching | Cần critical mass, privacy concerns, scope creep |
| Booking Management | Viloca là discovery app, không phải booking aggregator |

---

## 3. Phase 1 — Đặc tả kỹ thuật chi tiết

---

### 3.1 Home Screen Dashboard

**File:** `app/(app)/index.tsx` — viết lại hoàn toàn

**Mục tiêu:** User mở app → thấy ngay thông tin cá nhân hóa, không cần navigate thêm.

#### Layout

```
┌─────────────────────────────┐
│  Chào buổi sáng, [tên]      │  ← greeting theo giờ
│  [Avatar]          [🔔]     │
├─────────────────────────────┤
│  UPCOMING TRIP CARD          │
│  [cover image mờ bg]        │
│  "Đà Lạt 2026"              │
│  📍 Đà Lạt  ·  12 ngày nữa │
│  ████████░░░  progress       │
│  [Xem chi tiết →]           │
├─────────────────────────────┤
│  HÔM NAY (khi đang trip)    │
│  08:00  Café Trung Nguyên   │
│  10:00  Thác Datanla         │
│  18:00  Nhà hàng Đà Lạt     │
├─────────────────────────────┤
│  THAO TÁC NHANH (2×2)       │
│  [+ Trip]  [💰 Chi phí]     │
│  [📝 Journal] [🎒 Hành lý] │
├─────────────────────────────┤
│  GỢI Ý CHO BẠN              │
│  → horizontal scroll cards  │
└─────────────────────────────┘
```

#### Sections

| Section | Nội dung | Hiển thị khi |
|---|---|---|
| Header | Greeting theo giờ + Avatar + chuông | Luôn |
| Upcoming Trip Card | Tên trip, điểm đến, đếm ngược ngày | Có trip sắp đến |
| Today's Schedule | Lịch trình hôm nay theo time slot | Đang trong trip (active) |
| Quick Actions (2×2) | + Trip · Chi phí · Journal · Hành lý | Luôn |
| Recommended Places | Horizontal scroll experience cards | Luôn |

#### Animations

| Component | Loại animation | Thư viện | Chi tiết |
|---|---|---|---|
| Trip Card | FadeIn + SlideUp | Reanimated | opacity 0→1, y 20→0, delay 100ms, 400ms |
| Budget bar | width 0%→X% | Reanimated `withTiming` | 800ms, easing easeOut |
| Quick Actions | scale bounce khi press | Reanimated `withSpring` | scale 0.95→1 |
| Schedule items | Stagger FadeIn | Reanimated `withDelay` | mỗi item +80ms |
| Greeting text | FadeIn | Reanimated | 300ms |

#### Hooks sử dụng

```ts
const { trip, daysUntil } = useUpcomingTrip();
const { items, dayNumber } = useTodaySchedule(trip);
const { experiences: recommended } = useExperiences();
```

#### Greeting logic

```ts
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Chào buổi sáng'
               : hour < 18 ? 'Chào buổi chiều'
               : 'Chào buổi tối';
```

**No Trip State:** illustration + CTA "Tạo chuyến đi đầu tiên" + recommended places.

---

### 3.2 Search + Filter trong Khám Phá

**File:** `app/(app)/explore.tsx` — nhận code Explore từ `index.tsx` + thêm search/filter

#### Layout

```
┌─────────────────────────────┐
│  🔍 [Tìm kiếm địa điểm...] │  ← expandable search bar
├─────────────────────────────┤
│  [Tất cả][Ẩm thực][Văn hóa]│  ← filter chips (scroll ngang)
│  [Thiên nhiên][Check-in]    │
│  [Tỉnh thành ▾]  [Giá ▾]  │
├─────────────────────────────┤
│  "12 kết quả"               │
│  [Experience cards...]      │
└─────────────────────────────┘
```

#### Filter options

| Filter | UI | Giá trị |
|---|---|---|
| Từ khóa | TextInput expandable | Tìm theo title, location |
| Category | Chips scroll ngang | Tất cả · Ẩm thực · Văn hóa · Thiên nhiên · Check-in |
| Tỉnh thành | Chip ▾ → Modal | Danh sách từ mock data |
| Giá | Chip ▾ → Modal | 0 → 2,000,000 VNĐ |

#### Filter logic

```ts
const filtered = useMemo(() =>
  mockExperiences.filter(exp => {
    const matchQuery = exp.title.toLowerCase().includes(query.toLowerCase())
                    || exp.location.toLowerCase().includes(query.toLowerCase());
    const matchCat   = !activeCategory || exp.category === activeCategory;
    const matchPrice = exp.price >= priceRange[0] && exp.price <= priceRange[1];
    return matchQuery && matchCat && matchPrice;
  }), [query, activeCategory, priceRange]);
```

#### Animations

| Component | Animation | Chi tiết |
|---|---|---|
| Search bar focus | Expand width + fade | Reanimated `withSpring` |
| Filter chips | Slide-in stagger | delay +50ms mỗi chip |
| Results update | FadeIn | opacity 0→1, 200ms |
| Active chip | scale 1→1.05 + đổi màu | `withSpring` |
| Clear (×) | FadeIn conditional | Hiện khi `query.length > 0` |

---

### 3.3 Wishlist / Bookmark

#### Database migration

**File:** `supabase/migrations/20260620000000_add_bookmarks.sql`

```sql
create table public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  experience_id text not null,
  status        text check (status in ('want', 'planned', 'done')) default 'want',
  created_at    timestamptz default now(),
  unique(user_id, experience_id)
);

alter table public.bookmarks enable row level security;

create policy "Users manage own bookmarks"
  on public.bookmarks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

#### Trạng thái bookmark

| Trạng thái | Icon | Ý nghĩa | Màu |
|---|---|---|---|
| Chưa lưu | ♡ (outline) | Chưa bookmark | Gray |
| `want` | ♥ (filled) | Muốn đi | Red |
| `planned` | ♥ + 📅 | Đã lên kế hoạch | Orange |
| `done` | ♥ + ✓ | Đã đi | Green |

**Toggle cycle (nhấn nhanh):** chưa lưu → `want` → `planned` → `done` → xóa

**Long press:** mở bottom sheet để set thẳng trạng thái bất kỳ

#### Animations

| Trigger | Animation | Chi tiết |
|---|---|---|
| Tap bookmark | Heart scale bounce | `withSpring({ damping: 4, stiffness: 200 })` scale 1→1.4→1 |
| Đổi trạng thái | Color interpolation | `interpolateColor` gray→red→orange→green |
| Long press | Bottom sheet slide up | `translateY` 300→0 |
| Unbookmark | Scale + fade out | scale 1→0.8, opacity 1→0 rồi reset |

#### Hook — `useBookmarks()`

```ts
interface BookmarkHook {
  bookmarks:    Record<string, 'want' | 'planned' | 'done'>; // experienceId → status
  toggle:       (experienceId: string) => Promise<void>;     // cycle qua các trạng thái
  setStatus:    (experienceId: string, status: BookmarkStatus | null) => Promise<void>;
  isBookmarked: (experienceId: string) => boolean;
  loading:      boolean;
}
```

> Dùng **optimistic update**: cập nhật UI ngay, rollback nếu Supabase lỗi.

#### UI trong Profile — Tab "Đã lưu"

```
ĐÃ LƯU
[Muốn đi (5)]  [Đã kế hoạch (2)]  [Đã đi (8)]
────── horizontal tab selector ──────
[Experience cards lọc theo status]
```

---

### 3.4 Packing List

#### Database migration

**File:** `supabase/migrations/20260620000001_add_packing_items.sql`

```sql
create table public.packing_items (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid references public.trips(id) on delete cascade not null,
  name       text not null,
  is_packed  boolean default false,
  category   text default 'other',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.packing_items enable row level security;

create policy "Users manage packing via trip ownership"
  on public.packing_items for all
  using (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );
```

#### UI — Tab thứ 4 trong Trip Detail

**File:** `app/trip/[id].tsx` → tab bar: `[Timeline]  [Nhật ký]  [Thông tin]  [Hành lý]`

```
┌─────────────────────────────┐
│  🎒 Hành lý  ·  5/12 ✓     │
│  ████████░░░░░░  42%        │  ← animated progress bar
├─────────────────────────────┤
│  Gợi ý nhanh:               │
│  [🏖 Biển][⛰ Núi][✈ QT][💼 CT]
├─────────────────────────────┤
│  ☑  Hộ chiếu               │  ← checked: strike-through + mờ
│  ☑  Thẻ ngân hàng          │
│  ☐  Kem chống nắng         │
│  ☐  Áo mưa                 │
├─────────────────────────────┤
│  [+ Thêm vật dụng...]       │
└─────────────────────────────┘
```

#### Templates

| Template | Vật dụng |
|---|---|
| 🏖 Biển | Kem chống nắng · Kính râm · Đồ bơi · Dép lê · Khăn tắm |
| ⛰ Núi | Áo khoác · Giày trekking · Thuốc cảm · Đèn pin · Áo mưa |
| ✈ Quốc tế | Hộ chiếu · Visa · Thẻ ngoại tệ · Adapter điện · Bảo hiểm |
| 💼 Công tác | Laptop · Sạc dự phòng · Suit · Card visit · Tài liệu |

#### Animations

| Trigger | Animation | Chi tiết |
|---|---|---|
| Check item | Checkbox scale + color | `withSpring` scale 0.8→1, gray→green |
| Text checked | Strike-through + opacity | `textDecorationLine` + opacity 1→0.4 |
| Thêm item | SlideIn từ bottom | `translateY` 20→0 + opacity 0→1 |
| Xóa item | SlideOut + collapse | height→0 + opacity→0 |
| Progress bar | width 0→X% | `withTiming` 600ms |
| Template chips | FadeIn stagger | delay 50ms mỗi chip |

#### Hook — `usePackingList(tripId)`

```ts
interface PackingHook {
  items:        PackingItem[];
  progress:     { packed: number; total: number; percent: number };
  addItem:      (name: string, category?: string) => Promise<void>;
  togglePacked: (id: string) => Promise<void>;
  deleteItem:   (id: string) => Promise<void>;
  addTemplate:  (key: 'beach' | 'mountain' | 'international' | 'business') => Promise<void>;
  loading:      boolean;
}
```

---

## 4. Hooks Reference

| Hook | File | Mục đích | Tham số |
|---|---|---|---|
| `useUpcomingTrip` | `src/hooks/useUpcomingTrip.ts` | Trip sắp đến gần nhất + `daysUntil` | — |
| `useTodaySchedule` | `src/hooks/useTodaySchedule.ts` | Lịch trình hôm nay của active trip | `trip: Trip \| null` |
| `useBookmarks` | `src/hooks/useBookmarks.ts` | CRUD bookmark, optimistic update | — |
| `usePackingList` | `src/hooks/usePackingList.ts` | CRUD hành lý + templates + progress | `tripId: string` |
| `useExperiences` | `src/hooks/useExperiences.ts` | Filter mock experiences theo category | `category?: string` |
| `useAuth` | `src/hooks/useAuth.ts` | signIn / signUp / signOut | — |

---

## 5. Database Schema

### Bảng hiện có

| Bảng | Mô tả | Cột chính |
|---|---|---|
| `profiles` | Thông tin user | id, full_name, avatar_url, bio, travel_style[] |
| `trips` | Chuyến đi | id, user_id, title, destination, start_date, end_date, status |
| `trip_items` | Địa điểm trong trip | id, trip_id, experience_id, day_number, time_slot, note |
| `trip_journals` | Nhật ký hàng ngày | id, trip_id, day_number, content, photos[], mood, weather |

### Bảng thêm mới (Phase 1)

| Bảng | Migration file | Cột chính |
|---|---|---|
| `bookmarks` | `20260620000000_add_bookmarks.sql` | id, user_id, experience_id, status |
| `packing_items` | `20260620000001_add_packing_items.sql` | id, trip_id, name, is_packed, category, sort_order |

> ⚠️ Chạy 2 migration file trên trong **Supabase SQL Editor** trước khi test Bookmark và Packing List.

---

## 6. Danh sách file thay đổi

| File | Thao tác | Mô tả |
|---|---|---|
| `app/(app)/_layout.tsx` | Edit | 3 tab → 4 tab |
| `app/(app)/index.tsx` | Rewrite | Home Dashboard |
| `app/(app)/explore.tsx` | Edit | Explore + Search + Filter |
| `app/trip/[id].tsx` | Edit | Thêm tab Hành lý |
| `app/(app)/profile/index.tsx` | Edit | Thêm section Đã lưu |
| `src/types/index.ts` | Edit | Thêm `BookmarkStatus`, `Bookmark`, `PackingItem` |
| `src/hooks/useUpcomingTrip.ts` | New ✅ | Hook query trip sắp đến |
| `src/hooks/useTodaySchedule.ts` | New ✅ | Hook lịch hôm nay |
| `src/hooks/useBookmarks.ts` | New ✅ | Hook CRUD bookmark |
| `src/hooks/usePackingList.ts` | New ✅ | Hook CRUD packing + templates |
| `supabase/migrations/20260620000000_add_bookmarks.sql` | New ✅ | Bảng bookmarks + RLS |
| `supabase/migrations/20260620000001_add_packing_items.sql` | New ✅ | Bảng packing_items + RLS |

> **Không đụng:** `app/_layout.tsx` · `babel.config.js` · `app.json` · `metro.config.js`

---

## 7. Thứ tự triển khai

---

### ✅ Bước 1 — Chạy SQL Migrations

**Làm gì:** Chạy 2 file SQL trong Supabase Dashboard → SQL Editor.

**Công dụng:**
- Tạo bảng `bookmarks` để lưu địa điểm user muốn đi / đã đi
- Tạo bảng `packing_items` để lưu danh sách hành lý theo từng chuyến đi
- Mỗi bảng có **Row Level Security (RLS)** — user chỉ đọc/ghi được data của chính mình, không ai xem được data người khác

**Cần làm trước vì:** Nếu chưa có bảng trong DB mà chạy app, hook `useBookmarks` và `usePackingList` sẽ báo lỗi ngay khi gọi Supabase.

**File cần chạy (theo thứ tự):**
1. `supabase/migrations/20260620000000_add_bookmarks.sql`
2. `supabase/migrations/20260620000001_add_packing_items.sql`

---

### ✅ Bước 2 — Tạo Hooks (đã xong)

**Làm gì:** Tạo 4 custom hooks trong `src/hooks/`.

**Công dụng của từng hook:**

| Hook | Làm gì | Dùng ở đâu |
|---|---|---|
| `useUpcomingTrip` | Query Supabase lấy trip sắp đến gần nhất, tính số ngày còn lại | Home Dashboard |
| `useTodaySchedule` | Nếu đang trong trip active, lấy danh sách địa điểm của hôm nay | Home Dashboard |
| `useBookmarks` | Load toàn bộ bookmark của user, hỗ trợ toggle/set trạng thái có optimistic update | Explore, Experience Detail, Profile |
| `usePackingList` | CRUD hành lý cho một trip cụ thể, tính progress, hỗ trợ thêm template nhanh | Trip Detail tab Hành lý |

**Tại sao làm trước UI:** Hook là logic thuần — không render gì, không đụng vào file layout hay screen nào. Team có thể code UI song song mà không conflict.

---

### Bước 3 — Search + Filter trong Khám Phá

**File:** `app/(app)/explore.tsx`

**Làm gì:** Chuyển toàn bộ code màn hình Khám Phá từ `index.tsx` sang `explore.tsx`, sau đó thêm:
- **Search bar** có thể mở rộng khi focus, lọc realtime theo tên và địa điểm
- **Filter chips** theo category (Ẩm thực, Văn hóa, Thiên nhiên, Check-in)
- **Dropdown** lọc theo tỉnh thành và khoảng giá
- **Result count** hiển thị "X kết quả"
- **Empty state** khi không có kết quả + nút "Xóa bộ lọc"

**Công dụng:** Đây là tính năng cơ bản nhất mà mọi app discovery cần có. Hiện tại user không thể tìm địa điểm cụ thể — nếu họ đã biết mình muốn đi đâu mà không tìm được là rời app ngay.

**Tại sao làm bước này trước:** `explore.tsx` là file riêng biệt, không đụng đến `_layout.tsx` hay `index.tsx`. Ít conflict nhất.

---

### Bước 4 — Bookmark Button trên Experience Cards

**File:** `app/(app)/explore.tsx` + `app/experience/[id].tsx`

**Làm gì:**
- Thêm icon bookmark (♡/♥) ở góc trên bên phải mỗi experience card
- Nhấn nhanh: toggle qua các trạng thái `chưa lưu → muốn đi → đã kế hoạch → đã đi → xóa`
- Nhấn giữ (long press): mở bottom sheet để chọn trạng thái cụ thể
- Thêm section **"Đã lưu"** trong màn hình Profile, phân tab theo trạng thái
- Animation: tim đập khi bookmark, đổi màu theo trạng thái

**Công dụng:** Tạo **data lock-in** — user có collection địa điểm cá nhân chỉ có trong app này. Switching cost cao: nếu rời Viloca, mất hết danh sách đã lưu. Đây là cơ chế giữ user lâu dài giống Letterboxd (phim), Goodreads (sách).

**Dùng hook:** `useBookmarks()` — đã tạo ở Bước 2, chỉ cần gọi vào component.

---

### Bước 5 — Packing List Tab trong Trip Detail

**File:** `app/trip/[id].tsx`

**Làm gì:**
- Thêm tab thứ 4 **"Hành lý"** vào tab bar của màn hình Trip Detail (hiện có: Timeline, Nhật ký, Thông tin)
- Hiển thị danh sách checklist vật dụng với checkbox, tên, nút xóa
- **Progress bar** animated cho biết đã chuẩn bị bao nhiêu % hành lý
- **Template chips** (Biển / Núi / Quốc tế / Công tác) — nhấn 1 cái, tự thêm bộ vật dụng gợi ý vào danh sách
- Input thêm vật dụng tùy chỉnh ở cuối list
- Animation: tick xanh khi check, chữ gạch ngang khi đã chuẩn bị

**Công dụng:** Giải quyết pain point thực tế — ai đi du lịch cũng cần list đồ. User sẽ mở app **nhiều lần trước chuyến đi** để tick từng món. Đây là tính năng tạo thói quen dùng app hàng ngày tự nhiên nhất.

**Dùng hook:** `usePackingList(tripId)` — đã tạo ở Bước 2.

---

### Bước 6 — Home Dashboard + Navigation (4 tabs)

**File:** `app/(app)/index.tsx` (rewrite) + `app/(app)/_layout.tsx` (edit)

**Làm gì:**

*`_layout.tsx`* — thêm tab Explore mới, cập nhật label và icon:
```
Cũ: Khám phá (index) | Trip | Hồ sơ
Mới: Home (index) | Khám phá (explore) | Chuyến đi | Hồ sơ
```

*`index.tsx`* — viết lại thành Home Dashboard với các section:
- **Header** greeting thay đổi theo giờ (Chào buổi sáng / chiều / tối) + tên user
- **Upcoming Trip Card** — hiện trip sắp đến gần nhất, countdown ngày, progress lịch trình đã lên
- **Today's Schedule** — nếu đang trong active trip: danh sách địa điểm hôm nay theo giờ
- **Quick Actions** (2×2 grid) — lối tắt nhanh đến các tính năng hay dùng
- **Recommended Places** — horizontal scroll gợi ý experience

**Công dụng:** Đây là màn hình đầu tiên user thấy mỗi khi mở app. Hiện tại `index.tsx` chỉ là màn hình Explore — không có giá trị "quay lại" vì nội dung không đổi. Home Dashboard tạo lý do để mở app mỗi ngày: xem còn bao nhiêu ngày đến trip, lịch hôm nay đi đâu, đã chuẩn bị gì chưa.

**Tại sao làm cuối cùng:** `_layout.tsx` là file nhạy cảm — nhiều người trong team có thể đã chỉnh sửa. Làm cuối để dễ resolve conflict nhất và không block các bước trên.

---

### Tóm tắt tiến độ

| Bước | Trạng thái | File chính |
|---|---|---|
| 1. SQL Migrations | ⏳ Chờ chạy thủ công | Supabase SQL Editor |
| 2. Hooks | ✅ Hoàn thành | `src/hooks/*.ts` |
| 3. Search + Filter | 🔲 Chưa làm | `app/(app)/explore.tsx` |
| 4. Bookmark UI | 🔲 Chưa làm | `explore.tsx`, `experience/[id].tsx`, `profile/index.tsx` |
| 5. Packing List Tab | 🔲 Chưa làm | `app/trip/[id].tsx` |
| 6. Home Dashboard | 🔲 Chưa làm | `app/(app)/index.tsx`, `_layout.tsx` |
