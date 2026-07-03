# Viloca — Mobile App Product Spec (MVP)
> Tài liệu này dành cho Claude Code. Đọc toàn bộ trước khi bắt đầu code.

---

## 0. Meta

| Field | Value |
|---|---|
| App name | **Viloca** |
| Tagline | *Experience local culture like a local* |
| Platform | React Native (iOS + Android, Expo managed workflow) |
| Backend | Supabase (auth + database + storage) |
| Goal | MVP pitch cho nhà đầu tư |
| Data | Mock data — không cần real API calls ngoài Supabase auth |
| Language | UI tiếng Việt, code/comments tiếng Anh |

---

## 1. Design System

### 1.1 Color Tokens

Định nghĩa toàn bộ màu trong `src/theme/colors.ts`. **Không hardcode hex trong component.**

```ts
export const colors = {
  // Primary — Terracotta
  primary600: '#C8602E',   // CTA buttons, active nav, header bar
  primary400: '#E8895C',   // Hover state, highlight
  primary100: '#F5E4D6',   // Tag background, chip, light badge

  // Secondary — Forest Green
  secondary600: '#3D7A5A', // Secondary action, nature badge, booking confirmed
  secondary400: '#72AA8A', // Icon, indicator, progress
  secondary100: '#D8EDE3', // Tag background, success state

  // Neutral
  bgScreen:  '#FAF7F2',    // Screen background (60% of UI)
  bgCard:    '#FFFFFF',    // Cards, bottom sheets
  border:    '#EDE3D8',    // Dividers, input borders

  // Text
  textPrimary:  '#2D1A0E', // Headlines, body copy
  textMuted:    '#8A7060', // Subtitles, placeholder, labels
  textOnDark:   '#FFFFFF', // Text on colored backgrounds
}
```

### 1.2 Typography

Định nghĩa trong `src/theme/typography.ts`.

```ts
export const typography = {
  h1:    { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  h2:    { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  h3:    { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  body:  { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
  small: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  label: { fontSize: 11, fontWeight: '500', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
}
```

### 1.3 Spacing & Radius

```ts
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
export const radius  = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 }
```

### 1.4 Tỷ lệ màu trong UI

- **60%** `bgScreen` — nền màn hình, input fields, khoảng trắng
- **25%** Terracotta — buttons, header, hero cards, active states
- **15%** Forest Green — secondary cards, nature tags, success badge

---

## 2. Project Structure

```
viloca/
├── app/                        # Expo Router file-based navigation
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── splash.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Bottom tab navigator
│   │   ├── index.tsx           # Home / Discovery Feed
│   │   ├── explore.tsx         # Search & Filter (future)
│   │   ├── workspace.tsx       # Trip Workspace
│   │   └── profile.tsx         # User Profile & Settings
│   └── _layout.tsx             # Root layout, auth gate
├── src/
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── components/
│   │   ├── ui/                 # Atomic: Button, Tag, Avatar, Card, Badge
│   │   └── screens/            # Composite screen-level components
│   ├── data/
│   │   └── mock/               # All mock JSON data files
│   ├── hooks/                  # useAuth, useTrip, useExperiences
│   ├── lib/
│   │   └── supabase.ts         # Supabase client init
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── assets/
│   └── images/                 # Placeholder images (use picsum.photos URLs for mock)
├── app.json
├── package.json
└── tsconfig.json
```

---

## 3. Supabase Setup

### 3.1 Auth
- Dùng **Supabase Email/Password auth** cho MVP
- Sau khi đăng nhập thành công → lưu session vào `AsyncStorage`
- `useAuth` hook expose: `user`, `signIn()`, `signUp()`, `signOut()`, `loading`

### 3.2 Database Schema (chạy trong Supabase SQL editor)

```sql
-- Users profile (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  avatar_url text,
  bio text,
  travel_style text[],       -- ['slow', 'foodie', 'adventure']
  created_at timestamptz default now()
);

-- Experiences (mock data seed)
create table experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text,
  category text,             -- 'food_tour' | 'workshop' | 'trekking' | 'cultural'
  price numeric,
  rating numeric,
  review_count int,
  duration_hours numeric,
  cover_image text,          -- URL
  guide_name text,
  guide_avatar text,
  description text,
  tags text[],
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- Trips
create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text,
  destination text,
  start_date date,
  end_date date,
  cover_image text,
  status text default 'planning',  -- 'planning' | 'active' | 'completed'
  created_at timestamptz default now()
);

-- Trip timeline items
create table trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  experience_id uuid references experiences(id),
  day_number int,
  time_slot text,            -- 'morning' | 'afternoon' | 'evening'
  note text,
  created_at timestamptz default now()
);
```

### 3.3 Mock Data Seed
Seed file tại `src/data/mock/experiences.ts` — tối thiểu **12 experiences** với đầy đủ fields, bao gồm các địa điểm đa dạng:
- Hội An, Đà Lạt, Sa Pa, Hà Nội Old Quarter, Mũi Né, Mù Cang Chải
- Mix các category: food_tour, workshop, trekking, cultural
- 3–4 items đánh `is_featured: true`

---

## 4. Screens & Navigation

### 4.1 Navigation Structure

```
Root
├── (auth) — hiển thị nếu chưa đăng nhập
│   ├── splash.tsx        → auto-redirect sau 2s
│   └── onboarding.tsx    → 3 slides + form đăng ký/đăng nhập
└── (tabs) — hiển thị sau khi đăng nhập
    ├── Home (index.tsx)
    ├── Workspace (workspace.tsx)
    └── Profile (profile.tsx)
```

Bottom tab bar có **3 tabs**: Home, Workspace, Profile.
Icon dùng `@expo/vector-icons` (Ionicons).

---

## 5. Screen Specifications

---

### Screen 1 — Splash

**File:** `app/(auth)/splash.tsx`

**Layout:**
- Full screen, background `primary600` (#C8602E)
- Center: Logo text "Viloca" — font size 48, bold, màu `textOnDark`
- Dưới logo: tagline *"Experience local culture like a local"* — `small`, màu `rgba(255,255,255,0.75)`
- Bottom: subtle animated dots loading indicator (3 dots nhấp nháy)

**Logic:**
- Sau 2.5 giây → check Supabase session
- Nếu có session → navigate `(tabs)`
- Nếu không → navigate `(auth)/onboarding`

---

### Screen 2 — Onboarding

**File:** `app/(auth)/onboarding.tsx`

**Structure:** FlatList horizontal paging — 3 slides + 1 slide cuối là Auth form

**Slide 1 — Discover:**
- Image placeholder (picsum, warm landscape)
- Title: *"Khám phá trải nghiệm địa phương"*
- Body: *"Tìm những chuyến đi chân thực cùng người dân bản địa — không phải tour đại trà."*

**Slide 2 — Connect:**
- Image placeholder (people, community)
- Title: *"Kết nối với Local Guides"*
- Body: *"Người dẫn đường là người dân địa phương — họ biết những góc khuất mà không guidebook nào có."*

**Slide 3 — Plan:**
- Image placeholder (map/workspace)
- Title: *"Lên kế hoạch theo cách của bạn"*
- Body: *"Trip Workspace giúp bạn tổ chức toàn bộ hành trình — từ lịch trình đến ghi chú cá nhân."*

**Slide 4 — Auth Form:**
- Toggle: `Đăng nhập` / `Đăng ký`
- Fields: Email, Password (+ Full Name nếu đăng ký)
- Button: primary CTA màu `primary600`
- Khi submit → gọi Supabase auth → navigate `(tabs)`
- Error handling: hiển thị inline error message

**Navigation dots:** Row of dots ở bottom — active dot màu `primary600`, inactive màu `primary100`

---

### Screen 3 — Home / Discovery Feed

**File:** `app/(tabs)/index.tsx`

**Header:**
- Background `bgScreen`
- Left: Avatar nhỏ của user + *"Xin chào, [tên]"* (màu `textPrimary`)
- Right: Icon bell (notification, non-functional cho MVP)

**Section 1 — Search Bar:**
- Input với icon search
- Placeholder: *"Bạn muốn khám phá điều gì?"*
- Border màu `border`, border radius `radius.lg`
- Non-functional cho MVP (chỉ UI)

**Section 2 — Category Filter:**
- Horizontal ScrollView, không có scrollbar
- Tags: `Tất cả` · `Ẩm thực` · `Văn hóa` · `Thiên nhiên` · `Workshop`
- Active tag: background `primary600`, text `textOnDark`
- Inactive tag: background `primary100`, text `primary600`
- Filter state ảnh hưởng đến danh sách experiences bên dưới

**Section 3 — Featured Experiences:**
- Label: `ĐANG NỔI BẬT`
- Horizontal ScrollView
- Mỗi card: width 260, height 180
  - Cover image (borderRadius `radius.lg`)
  - Overlay gradient tối ở bottom
  - Title (màu white, bold), location (màu white 75%)
  - Badge category góc trên phải: background `primary600`

**Section 4 — Nearby / All Experiences:**
- Label: `TRẢI NGHIỆM GỢI Ý`
- Vertical list (VirtualizedList / FlatList)
- Mỗi card dạng horizontal:
  - Image bên trái (80×80, borderRadius `radius.md`)
  - Right: Title, location (icon pin + text), price, rating (icon star + số)
  - Tag category dưới title: background `secondary100`, text `secondary600`
- Tap vào card → không có detail screen trong MVP, có thể hiện bottom sheet đơn giản với mô tả + nút "Thêm vào Trip"

**Bottom Sheet — Experience Detail (khi tap card):**
- Modal bottom sheet (dùng `@gorhom/bottom-sheet`)
- Cover image full width, height 200
- Title, location, rating, price, duration
- Description (2–3 dòng)
- Tags row
- Button: *"Thêm vào Trip"* → màu `primary600` → append vào trip hiện tại (trip đầu tiên trong danh sách)

---

### Screen 4 — Trip Workspace

**File:** `app/(tabs)/workspace.tsx`

**Header:**
- Title: *"Trip Workspace"*
- Right button: `+ Trip mới` → mở modal tạo trip

**Empty State (chưa có trip):**
- Illustration đơn giản (SVG hoặc emoji large)
- Text: *"Chưa có chuyến đi nào"*
- CTA button: *"Tạo Trip đầu tiên"*

**Trip Card (khi đã có trip):**
- Dạng card nổi, cover image full width, height 160
- Title trip, destination, date range
- Status badge: `Đang lên kế hoạch` / `Đang diễn ra` / `Hoàn thành`
- Tap → mở Trip Detail

**Trip Detail Screen** `app/trip/[id].tsx`:

Layout chia làm **4 sub-sections**, dùng tab nội tuyến (segmented control):

#### Tab A — Timeline

- Header: Tên trip + date range
- List theo ngày: `Ngày 1`, `Ngày 2`, ...
- Mỗi ngày expand/collapse
- Trong mỗi ngày: `Buổi sáng`, `Buổi chiều`, `Buổi tối`
- Mỗi slot hiển thị experience card nhỏ (nếu đã thêm) hoặc nút `+ Thêm hoạt động`
- Drag-to-reorder items trong ngày (dùng `react-native-draggable-flatlist`)

#### Tab B — Map

- Dùng `react-native-maps` (MapView)
- Hiển thị markers tại các điểm đã có trong trip
- Marker màu `primary600`
- Tap marker → callout với tên địa điểm + ngày
- Map region tự fit để bao gồm tất cả markers

#### Tab C — Journal

- Scrollable list các journal entries theo ngày
- Mỗi entry: date header + TextInput multiline
- Nút `+ Thêm ghi chú hôm nay`
- Lưu entries vào Supabase table `trip_journals` (tạo thêm nếu chưa có)
- Placeholder: *"Hôm nay bạn cảm nhận điều gì?"*

#### Tab D — Info

- Trip title (editable inline)
- Destination
- Date range (DatePicker)
- Cover image (ImagePicker — optional, dùng picsum nếu không chọn)
- Nút `Xóa Trip` — màu đỏ, có confirm dialog

**Modal — Tạo Trip Mới:**
- Fields: Tên chuyến đi, Điểm đến, Ngày đi, Ngày về
- Button: `Tạo Trip` → insert vào Supabase `trips` table → navigate đến Trip Detail

---

### Screen 5 — Profile & Settings

**File:** `app/(tabs)/profile.tsx`

**Header section:**
- Avatar tròn (80px) — từ Supabase storage hoặc placeholder initials
- Full name (h2)
- Bio text (small, màu textMuted)
- Button `Chỉnh sửa hồ sơ` — outline style, borderColor `primary600`

**Stats row:**
- 3 metric cards ngang: `Trips`, `Trải nghiệm`, `Địa điểm`
- Con số lấy từ Supabase count queries

**Section — Travel Style:**
- Label: `PHONG CÁCH DU LỊCH`
- Tags: `Slow Travel` · `Foodie` · `Adventure` · `Cultural` · `Healing`
- Editable — tap để toggle, lưu vào `profiles.travel_style`

**Section — My Trips:**
- Horizontal scroll list trip cards (thumbnail nhỏ)
- Link *"Xem tất cả"* → navigate `workspace` tab

**Section — Settings:**
- List items dạng row: `Thông báo`, `Ngôn ngữ`, `Điều khoản`, `Chính sách bảo mật`
- Cuối: nút `Đăng xuất` — text màu `primary600`, tap → `signOut()` → navigate `(auth)`

**Edit Profile Modal:**
- Fields: Full name, Bio, Avatar (ImagePicker)
- Button `Lưu` → update `profiles` table

---

## 6. Shared UI Components

Tất cả components trong `src/components/ui/`. Mỗi component phải nhận `style` prop để override ngoài.

| Component | Props | Notes |
|---|---|---|
| `Button` | `label`, `onPress`, `variant` (`primary`/`outline`/`ghost`), `size` (`sm`/`md`/`lg`), `loading`, `disabled` | Loading state hiện ActivityIndicator thay label |
| `Tag` | `label`, `color` (`terracotta`/`forest`/`neutral`) | Dùng color tokens |
| `Avatar` | `uri`, `name`, `size` | Fallback initials nếu không có uri |
| `Card` | `children`, `onPress`, `style` | White bg, border, radius.lg, shadow nhẹ |
| `Badge` | `label`, `color` | Nhỏ hơn Tag, dùng cho status |
| `SectionHeader` | `title`, `actionLabel`, `onAction` | Label uppercase + action link phải |
| `EmptyState` | `icon`, `title`, `body`, `ctaLabel`, `onCta` | Center layout |
| `ScreenWrapper` | `children`, `scrollable` | SafeAreaView + bg bgScreen |

---

## 7. Mock Data Structure

File: `src/data/mock/experiences.ts`

```ts
export interface Experience {
  id: string
  title: string
  location: string
  category: 'food_tour' | 'workshop' | 'trekking' | 'cultural'
  price: number          // VND, ví dụ: 350000
  rating: number         // 4.2
  reviewCount: number
  durationHours: number
  coverImage: string     // picsum URL, ví dụ: https://picsum.photos/seed/hoian/400/300
  guideName: string
  guideAvatar: string    // picsum URL
  description: string
  tags: string[]
  isFeatured: boolean
}
```

Seed ít nhất 12 experiences. Dùng `picsum.photos/seed/{keyword}/{w}/{h}` để ảnh consistent.

---

## 8. Dependencies

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "react-native": "0.74.x",
    "@supabase/supabase-js": "^2.x",
    "react-native-url-polyfill": "^2.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "react-native-maps": "^1.x",
    "@gorhom/bottom-sheet": "^4.x",
    "react-native-draggable-flatlist": "^4.x",
    "@expo/vector-icons": "^14.x",
    "expo-image-picker": "~15.x",
    "expo-linear-gradient": "~13.x"
  }
}
```

---

## 9. Environment Variables

File `.env.local` (KHÔNG commit lên git):

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Đọc trong `src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)
export default supabase
```

---

## 10. Build & Run Instructions

```bash
# Setup
npx create-expo-app viloca --template blank-typescript
cd viloca
npx expo install [all dependencies above]

# Dev
npx expo start

# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android
```

---

## 11. Acceptance Criteria (MVP Done khi...)

- [ ] Splash → Onboarding → Auth flow chạy được end-to-end
- [ ] Đăng ký / đăng nhập bằng Supabase email auth thành công
- [ ] Home feed hiển thị mock experiences, category filter hoạt động
- [ ] Bottom sheet experience detail mở được, nút "Thêm vào Trip" append vào trip
- [ ] Tạo trip mới, thấy trong Workspace
- [ ] Trip Detail: Timeline tab hiển thị experiences đã thêm theo ngày
- [ ] Trip Detail: Map tab hiển thị markers
- [ ] Trip Detail: Journal tab nhập và lưu được ghi chú
- [ ] Profile hiển thị đúng thông tin user, travel style toggle lưu được
- [ ] Đăng xuất → về màn hình Onboarding
- [ ] Toàn bộ UI dùng đúng color tokens, không có màu hardcode
- [ ] Không có TypeScript errors khi build

---

## 12. Lưu ý cho Claude Code

1. **Bắt đầu bằng** `npx create-expo-app` → setup theme tokens → Supabase client → rồi mới vào screens
2. **Không** tự sáng tạo màu sắc ngoài bộ color tokens đã định nghĩa ở Section 1
3. **Mock data** dùng cho tất cả experiences; chỉ auth + trips + journal là real Supabase calls
4. **Ảnh** dùng `picsum.photos/seed/{keyword}/400/300` — không cần download về
5. Nếu một dependency không tương thích với Expo SDK version, dùng `npx expo install` thay vì `npm install` để tự resolve đúng version
6. Mỗi screen **phải** wrap trong `<ScreenWrapper>` để đảm bảo SafeAreaView và background đồng nhất
7. Khi navigate giữa `(auth)` và `(tabs)`, dùng `router.replace()` thay vì `router.push()` để tránh back về auth sau khi đã đăng nhập