# Viloca — System Architecture

## 1. Tổng quan

```
┌─────────────────────────────────────────┐
│           React Native App              │
│      (Expo SDK 56 / RN 0.85)           │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ expo-    │  │NativeWind│  │Zustand│ │
│  │ router   │  │v4 + TW3  │  │store  │ │
│  └──────────┘  └──────────┘  └───────┘ │
└────────────────────┬────────────────────┘
                     │ HTTPS / WebSocket
┌────────────────────▼────────────────────┐
│              Supabase                   │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │   Auth   │  │PostgREST │  │Storage│ │
│  │(GoTrue)  │  │(REST API)│  │ (S3)  │ │
│  └──────────┘  └──────────┘  └───────┘ │
│  ┌──────────┐  ┌──────────┐            │
│  │Realtime  │  │  Edge    │            │
│  │(WS/PG)  │  │Functions │            │
│  └──────────┘  └──────────┘            │
│                                         │
│         PostgreSQL Database             │
└─────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Folder Structure

```
viloca/
├── app/                          # Expo Router — file-based routing
│   ├── _layout.tsx               # Root layout: auth guard + global CSS
│   ├── index.tsx                 # Redirect → /(auth)/splash
│   ├── (auth)/
│   │   ├── _layout.tsx           # Stack navigator, no header
│   │   ├── splash.tsx            # Auto-redirect sau 2.5s
│   │   └── onboarding.tsx        # 3 slides + auth form
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab navigator (3 tabs)
│   │   ├── index.tsx             # Home / Discovery Feed
│   │   ├── workspace.tsx         # Trip Workspace
│   │   └── profile.tsx           # Profile & Settings
│   └── trip/
│       └── [id].tsx              # Trip Detail (Timeline/Map/Journal/Info)
│
├── src/
│   ├── theme/
│   │   ├── colors.ts             # Color tokens
│   │   ├── typography.ts         # Text styles
│   │   └── spacing.ts            # Spacing, radius, shadow
│   ├── components/
│   │   ├── ui/                   # Atomic components
│   │   │   ├── Button.tsx
│   │   │   ├── Tag.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ScreenWrapper.tsx
│   │   └── screens/              # Composite screen-level components
│   │       ├── ExperienceCard.tsx
│   │       ├── FeaturedCard.tsx
│   │       ├── TripCard.tsx
│   │       └── ExperienceBottomSheet.tsx
│   ├── hooks/
│   │   ├── useAuth.ts            # signIn, signUp, signOut, loading
│   │   ├── useTrip.ts            # CRUD trips, trip items
│   │   ├── useExperiences.ts     # fetch experiences, filter by category
│   │   └── useProfile.ts         # fetch/update profile
│   ├── data/
│   │   └── mock/
│   │       └── experiences.ts    # 12 mock experiences
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── lib/
│       └── supabase.ts           # Supabase client (default export)
│
├── store/
│   └── authStore.ts              # Zustand: user state
├── lib/
│   └── supabase.ts               # (legacy, giữ lại để không break import)
├── assets/
├── global.css                    # Tailwind entry point
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
└── app.json
```

### 2.2 Routing & Auth Flow

```
App Start
    │
    ▼
app/_layout.tsx
    │ supabase.auth.onAuthStateChange()
    ├── session exists ──────────────► /(tabs)/index
    └── no session ─────────────────► /(auth)/splash
                                            │
                                       splash.tsx (2.5s)
                                            │
                                       onboarding.tsx
                                            │
                                    ┌───────┴────────┐
                                  login           register
                                    │                │
                                    └───────┬────────┘
                                    Supabase Auth
                                            │
                                       /(tabs)/index
```

### 2.3 State Management

**Zustand stores** (không persist trong MVP):

```ts
// store/authStore.ts
{
  user: User | null,
  setUser: (user) => void
}
```

**Server state** — không dùng React Query trong MVP, fetch trực tiếp trong hooks:

```ts
// src/hooks/useExperiences.ts
const useExperiences = (category?: string) => {
  const [experiences, setExperiences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('experiences')
      .select('*')
      .eq(category ? 'category' : '', category ?? '')
      .then(({ data }) => setExperiences(data ?? []))
      .finally(() => setLoading(false))
  }, [category])

  return { experiences, loading }
}
```

**Local state** — useState trong component cho form, toggle, modal state.

---

## 3. Backend Architecture (Supabase)

### 3.1 Database Schema — MVP

```sql
-- Extends auth.users, tạo tự động qua trigger
create table profiles (
  id            uuid references auth.users primary key,
  full_name     text,
  avatar_url    text,
  bio           text,
  travel_style  text[],        -- ['slow', 'foodie', 'adventure']
  push_token    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Mock data được seed sẵn
create table experiences (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  location       text,
  category       text,          -- 'food_tour'|'workshop'|'trekking'|'cultural'
  price          numeric,
  rating         numeric,
  review_count   int,
  duration_hours numeric,
  cover_image    text,
  guide_name     text,
  guide_avatar   text,
  description    text,
  tags           text[],
  is_featured    boolean default false,
  created_at     timestamptz default now()
);

create table trips (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  title        text,
  destination  text,
  start_date   date,
  end_date     date,
  cover_image  text,
  status       text default 'planning', -- 'planning'|'active'|'completed'
  summary_note text,
  is_public    boolean default false,
  share_slug   text unique,
  view_count   int default 0,
  created_at   timestamptz default now()
);

create table trip_items (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid references trips(id) on delete cascade,
  experience_id uuid references experiences(id),
  day_number    int,
  time_slot     text,           -- 'morning'|'afternoon'|'evening'
  note          text,
  sort_order    int default 0,
  created_at    timestamptz default now()
);

create table trip_journals (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid references trips(id) on delete cascade,
  day_number int,
  content    text,
  photos     text[],
  mood       text,              -- 'great'|'good'|'okay'|'tired'
  weather    text,              -- 'sunny'|'rainy'|'cloudy'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 3.2 Row Level Security (RLS)

```sql
-- Profiles: ai cũng đọc được, chỉ owner sửa được
alter table profiles enable row level security;
create policy "Public profiles" on profiles for select using (true);
create policy "Own profile update" on profiles for update using (auth.uid() = id);

-- Trips: chỉ owner xem/sửa, trừ public trips
alter table trips enable row level security;
create policy "Own trips" on trips for all using (auth.uid() = user_id);
create policy "Public trips viewable" on trips for select using (is_public = true);

-- Trip items & journals: theo trip owner
alter table trip_items enable row level security;
create policy "Own trip items" on trip_items for all
  using (exists (select 1 from trips where trips.id = trip_id and trips.user_id = auth.uid()));

alter table trip_journals enable row level security;
create policy "Own journals" on trip_journals for all
  using (exists (select 1 from trips where trips.id = trip_id and trips.user_id = auth.uid()));

-- Experiences: public read-only
alter table experiences enable row level security;
create policy "Public experiences" on experiences for select using (true);
```

### 3.3 Trigger — Auto-create Profile

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

### 3.4 Edge Functions (Phase 2)

```
supabase/functions/
├── daily-memory-cards/    # Cron daily: tính anniversary, insert memory_cards
├── trip-nudge/            # Cron daily: check trips sắp tới, gửi push notification
└── streak-update/         # Cron daily: cập nhật user_streaks
```

---

## 4. Data Flow

### Fetch Experiences (Home Screen)
```
HomeScreen
  → useExperiences(category)
    → supabase.from('experiences').select('*').eq('category', category)
      → PostgREST REST API
        → PostgreSQL
          → [{ id, title, ... }]
  → render ExperienceCard list
```

### Add Experience to Trip
```
User tap "Thêm vào Trip"
  → ExperienceBottomSheet
    → useTrip().addItem(tripId, experienceId, dayNumber, timeSlot)
      → supabase.from('trip_items').insert({ trip_id, experience_id, ... })
        → RLS check: trips.user_id = auth.uid()
          → Insert thành công
  → Optimistic UI update
  → Toast "Đã thêm vào Trip"
```

### Auth State Change
```
App start
  → supabase.auth.onAuthStateChange(callback)
    → Supabase checks AsyncStorage for session
      → session found: callback('SIGNED_IN', session)
        → authStore.setUser(session.user)
        → router.replace('/(tabs)')
      → no session: callback('SIGNED_OUT', null)
        → authStore.setUser(null)
        → router.replace('/(auth)/splash')
```

---

## 5. Dependencies

### Production
```json
{
  "expo": "~56.0.11",
  "expo-router": "~56.2.10",
  "react-native": "0.85.3",
  "react": "19.2.3",
  "@supabase/supabase-js": "^2.108.1",
  "@react-native-async-storage/async-storage": "2.2.0",
  "nativewind": "^4.2.5",
  "tailwindcss": "^3.4.19",
  "zustand": "^5.0.14",
  "expo-linear-gradient": "~14.0.2",
  "expo-image-picker": "~16.0.6",
  "@expo/vector-icons": "^14.0.0",
  "@gorhom/bottom-sheet": "^4.6.4",
  "react-native-maps": "1.18.0",
  "react-native-reanimated": "~3.17.4",
  "react-native-gesture-handler": "~2.22.0"
}
```

### Dev
```json
{
  "typescript": "~6.0.3",
  "@types/react": "~19.2.2"
}
```

---

## 6. Environment Variables

```env
# .env.local (không commit)
EXPO_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Đọc trong `src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

export default supabase
```

---

## 7. Scalability Notes

- **Phase 1–2:** Supabase Free tier đủ dùng (500MB DB, 50k MAU)
- **Phase 3 (Realtime):** Upgrade Supabase Pro khi cần Group Trip
- **Scale lớn:** Migrate từng phần sang AWS nếu cần — Supabase chạy trên AWS nên migration có thể từng bước
- **CDN:** Supabase Storage tích hợp CDN — ảnh user upload có thể serve qua CDN ngay
