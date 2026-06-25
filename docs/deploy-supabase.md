# Hướng dẫn triển khai Backend Viloca trên Supabase

> Tài liệu này hướng dẫn cách dựng toàn bộ backend từ đầu trên một Supabase project mới:
> Authentication, Database (13 migrations), Seed data, Edge Functions, và Storage.

---

## Mục lục

1. [Yêu cầu trước khi bắt đầu](#1-yêu-cầu-trước-khi-bắt-đầu)
2. [Tạo Supabase project mới](#2-tạo-supabase-project-mới)
3. [Cấu hình Authentication](#3-cấu-hình-authentication)
4. [Kết nối Supabase CLI](#4-kết-nối-supabase-cli)
5. [Chạy Database Migrations](#5-chạy-database-migrations)
6. [Seed dữ liệu Locations](#6-seed-dữ-liệu-locations)
7. [Cấu hình Storage](#7-cấu-hình-storage)
8. [Deploy Edge Functions](#8-deploy-edge-functions)
9. [Cấu hình biến môi trường cho app](#9-cấu-hình-biến-môi-trường-cho-app)
10. [Checklist kiểm tra sau triển khai](#10-checklist-kiểm-tra-sau-triển-khai)
11. [Xử lý sự cố thường gặp](#11-xử-lý-sự-cố-thường-gặp)

---

## 1. Yêu cầu trước khi bắt đầu

### Công cụ cần có

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---|---|---|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Supabase CLI | 1.200+ | `npx supabase --version` |
| Git | bất kỳ | `git --version` |

Cài Supabase CLI nếu chưa có:
```bash
npm install -g supabase
# hoặc dùng npx (không cần cài global)
npx supabase --version
```

### Tài khoản và API keys cần chuẩn bị

- **Supabase account** — [supabase.com](https://supabase.com)
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com) (dùng cho `batch-generate-hints`)
- **AWS credentials** — IAM user có quyền `bedrock:InvokeModel` tại region `ap-southeast-2` (dùng cho `plan-trip`)

---

## 2. Tạo Supabase project mới

### 2.1 Tạo project trên dashboard

1. Đăng nhập [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Điền thông tin:
   - **Name:** `viloca-prod` (hoặc tên tùy ý)
   - **Database password:** tạo password mạnh, lưu lại
   - **Region:** `Southeast Asia (Singapore)` — gần người dùng VN nhất
4. Click **Create new project** → chờ ~2 phút

### 2.2 Lấy thông tin kết nối

Sau khi project sẵn sàng, vào **Project Settings → API**:

| Thông tin | Vị trí trên dashboard | Dùng để |
|---|---|---|
| `Project URL` | API Settings → Project URL | `EXPO_PUBLIC_SUPABASE_URL` |
| `anon public key` | API Settings → Project API keys | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role key` | API Settings → Project API keys | Secret trong Edge Functions |
| `Project Ref` | Project Settings → General | Dùng cho CLI (`--project-ref`) |

> **Lưu ý bảo mật:** `service_role key` có quyền bypass RLS — không bao giờ đưa vào app client.

---

## 3. Cấu hình Authentication

### 3.1 Bật Email OTP

Viloca dùng **Email OTP** (magic link) để đăng ký/đăng nhập:

1. Vào **Authentication → Providers → Email**
2. Đảm bảo **Enable Email provider** = ON
3. Bật **Confirm email** = ON
4. Bật **Secure email change** = ON
5. Click **Save**

### 3.2 Cấu hình Email Templates (khuyến nghị)

Vào **Authentication → Email Templates → Confirm signup**:

```
Subject: Xác nhận tài khoản Viloca của bạn

Chào {{ .Email }},

Mã xác nhận của bạn là: {{ .Token }}

Mã có hiệu lực trong 60 phút.
```

Tương tự cho **Magic Link** template.

### 3.3 Cấu hình URL (cho deep link)

Vào **Authentication → URL Configuration**:

- **Site URL:** `viloca://` (deep link scheme của Expo app)
- **Redirect URLs:** thêm `viloca://**`

### 3.4 Giới hạn rate (tùy chọn)

Vào **Authentication → Rate Limits**:
- **Sign ups:** 10/hour per IP là đủ cho production ban đầu
- **OTP emails:** 5/hour per email

---

## 4. Kết nối Supabase CLI

### 4.1 Login CLI

```bash
npx supabase login
# Mở browser → đăng nhập → copy access token → paste vào terminal
```

### 4.2 Link project

Từ thư mục gốc của Viloca:

```bash
npx supabase link --project-ref <YOUR_PROJECT_REF>
# Nhập database password khi được hỏi
```

Kiểm tra kết nối thành công:

```bash
npx supabase status
```

---

## 5. Chạy Database Migrations

Chạy theo thứ tự. Có 2 cách:

### Cách A — CLI (khuyến nghị, tự động theo thứ tự)

```bash
npx supabase db push
```

CLI sẽ đọc tất cả files trong `supabase/migrations/` và chạy theo timestamp.

### Cách B — Thủ công qua SQL Editor

Nếu cần chạy từng file, vào **Supabase Dashboard → SQL Editor** và chạy theo thứ tự:

#### Migration 1: Tạo bảng profiles + trigger

`supabase/migrations/20260611093346_create_profiles_table.sql`

Tạo bảng `profiles` với các cột: `id, username, full_name, avatar_url, bio, created_at, updated_at`.

RLS policies: mọi người xem được, chỉ owner cập nhật được.

Trigger `on_auth_user_created`: tự tạo profile khi user đăng ký.

---

#### Migration 2: Cập nhật profiles trigger

`supabase/migrations/20260615000000_update_profiles_trigger.sql`

Cập nhật `handle_new_user()` để lấy `full_name` từ user metadata.

---

#### Migration 3: Thêm age_range vào profiles

`supabase/migrations/20260615000001_add_age_range_to_profiles.sql`

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_range TEXT;
```

---

#### Migration 4: Fix RLS + trigger (upsert-safe)

`supabase/migrations/20260616000000_fix_profiles_rls_and_trigger.sql`

Thêm INSERT policy. Cập nhật trigger thành `ON CONFLICT (id) DO UPDATE` để tránh lỗi khi user đăng ký lại sau email failure.

---

#### Migration 5: Tạo trips + trip_items + trip_journals

`supabase/migrations/20260619000000_create_trips_table.sql`

Tạo 3 bảng:

| Bảng | Mô tả |
|---|---|
| `trips` | Thông tin chuyến đi (title, destination, dates, status, cover_image) |
| `trip_items` | Các địa điểm trong ngày (day_number, time_slot, sort_order) |
| `trip_journals` | Nhật ký hằng ngày (content, photos, mood, weather) |

RLS: mọi thao tác đều qua ownership check `user_id = auth.uid()`.

---

#### Migration 6: Thêm cột experience vào trip_items

`supabase/migrations/20260619200000_add_experience_columns.sql`

```sql
ALTER TABLE public.trip_items
  ADD COLUMN IF NOT EXISTS experience_title    TEXT,
  ADD COLUMN IF NOT EXISTS experience_location TEXT,
  ADD COLUMN IF NOT EXISTS experience_image    TEXT,
  ADD COLUMN IF NOT EXISTS experience_category TEXT;
```

---

#### Migration 7: Tạo bảng bookmarks

`supabase/migrations/20260620000000_add_bookmarks.sql`

```sql
CREATE TABLE public.bookmarks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  experience_id TEXT NOT NULL,
  status        TEXT CHECK (status IN ('want', 'planned', 'done')) DEFAULT 'want',
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, experience_id)
);
```

RLS: users chỉ quản lý bookmark của mình.

---

#### Migration 8: Tạo bảng packing_items

`supabase/migrations/20260620000001_add_packing_items.sql`

```sql
CREATE TABLE public.packing_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  is_packed  BOOLEAN DEFAULT false,
  category   TEXT DEFAULT 'other',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

RLS: truy cập qua trip ownership.

---

#### Migration 9: Thêm is_ai_generated vào trips

`supabase/migrations/20260625000000_add_ai_generated_to_trips.sql`

```sql
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
```

---

#### Migration 10: Patch locations — thêm AI-required columns

`supabase/migrations/20260625000001_patch_locations_columns.sql`

Thêm vào bảng `locations`:
- `price_per_person` INTEGER DEFAULT 0
- `duration_minutes` INTEGER DEFAULT 120
- `rating` NUMERIC(2,1)
- `hint` TEXT
- `cover_image` TEXT

Tạo GIN index trên cột `vibes`.

> Bảng `locations` cần tồn tại trước (xem [mục 6](#6-seed-dữ-liệu-locations)).

---

#### Migration 11: Normalize category của locations

`supabase/migrations/20260625000002_normalize_locations_category.sql`

Chuẩn hóa 14 categories tiếng Việt:
`Ẩm thực | Bảo tàng | Café | Danh lam thắng cảnh | Di tích lịch sử | Di tích tín ngưỡng | Du lịch cộng đồng | Du lịch sinh thái | Làng nghề | Lưu trú | Nghệ thuật | Thiên nhiên | Trải nghiệm | Văn hóa`

---

#### Migration 12: Enrich locations — fill vibes, price, duration, rating, cover_image

`supabase/migrations/20260626000000_enrich_locations_fields.sql`

Điền hàng loạt các field thiếu theo category:
- `vibes[]` — gán theo nhóm category
- `price_per_person` — 30K–150K tùy category
- `duration_minutes` — 60–150 phút tùy category
- `rating` — mặc định 4.0 cho tất cả chưa có rating
- `cover_image` — `https://picsum.photos/seed/loc-{id}/800/600`

---

#### Migration 13: Thêm ai_reason vào trip_items

`supabase/migrations/20260626000001_add_ai_reason_to_trip_items.sql`

```sql
ALTER TABLE public.trip_items ADD COLUMN IF NOT EXISTS ai_reason TEXT;
```

Lưu lý do AI chọn địa điểm này để hiện trong detail modal.

---

### Kết quả sau tất cả migrations

Chạy lệnh sau để kiểm tra:

```sql
-- Trong SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Kết quả mong đợi:

```
bookmarks
locations
packing_items
profiles
trip_items
trip_journals
trips
```

---

## 6. Seed dữ liệu Locations

Bảng `locations` cần được tạo thủ công (chưa có migration tạo schema) và seed dữ liệu.

### 6.1 Tạo bảng locations (nếu chưa có)

Chạy trong SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.locations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  address             TEXT,
  district            TEXT,
  city                TEXT,
  category            TEXT NOT NULL,
  vibes               TEXT[] NOT NULL DEFAULT '{}',
  price_per_person    INTEGER NOT NULL DEFAULT 0,
  duration_minutes    INTEGER NOT NULL DEFAULT 120,
  rating              NUMERIC(2,1),
  hint                TEXT,
  hint_generated_at   TIMESTAMPTZ,
  cover_image         TEXT,
  images              TEXT[] NOT NULL DEFAULT '{}',
  description         TEXT,
  short_description   TEXT,
  opening_hours       TEXT,
  coordinates         JSONB,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Tất cả mọi người đều xem được locations (public data)
CREATE POLICY "Locations are public"
  ON public.locations FOR SELECT USING (true);

-- Chỉ service_role mới thêm/sửa/xóa (qua Edge Function hoặc dashboard)
-- (không cần policy vì service_role bypass RLS)

-- Index để tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_locations_city     ON public.locations (city);
CREATE INDEX IF NOT EXISTS idx_locations_category ON public.locations (category);
CREATE INDEX IF NOT EXISTS idx_locations_rating   ON public.locations (rating DESC);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON public.locations (is_active);
CREATE INDEX IF NOT EXISTS idx_locations_vibes    ON public.locations USING GIN (vibes);
```

### 6.2 Seed locations Hà Nội

Dự án có sẵn 73 locations Hà Nội. Để import toàn bộ, liên hệ team để lấy file SQL đầy đủ.

Nếu muốn seed thử với 5 locations Nha Trang từ file có sẵn:

```bash
# Từ terminal, dùng psql (lấy connection string từ Project Settings → Database)
psql "postgresql://postgres:[YOUR_DB_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres" \
  -f supabase/seed_locations_nhatrang.sql
```

Hoặc copy nội dung file `supabase/seed_locations_nhatrang.sql` vào SQL Editor.

### 6.3 Kiểm tra sau seed

```sql
SELECT COUNT(*), city FROM public.locations
WHERE is_active = true
GROUP BY city;
```

---

## 7. Cấu hình Storage

### 7.1 Tạo bucket cho Trip covers

1. Vào **Storage → Buckets → New bucket**
2. **Name:** `trip-covers`
3. **Public bucket:** ON (ảnh cover cần public URL)
4. Click **Create bucket**

### 7.2 Tạo bucket cho Journal photos

1. Tạo thêm bucket: **Name:** `journal-photos`
2. **Public bucket:** ON
3. Click **Create bucket**

### 7.3 Cấu hình Storage Policies

Vào **Storage → Policies** và tạo các policies sau cho từng bucket:

#### Cho `trip-covers` và `journal-photos`:

```sql
-- Ai cũng xem được (bucket đã public, nhưng vẫn cần policy để SELECT hoạt động)
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('trip-covers', 'journal-photos'));

-- Chỉ user đã đăng nhập mới upload được
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('trip-covers', 'journal-photos')
    AND auth.role() = 'authenticated'
  );

-- Chỉ owner mới xóa được file của mình
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('trip-covers', 'journal-photos')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

> **Quy ước đường dẫn:** Upload file theo pattern `{user_id}/{filename}` để policy xóa hoạt động đúng.
> Ví dụ: `trip-covers/abc123-user-id/trip-456.jpg`

---

## 8. Deploy Edge Functions

Viloca có 2 Edge Functions:

| Function | Mô tả | Dependencies |
|---|---|---|
| `plan-trip` | Tạo lịch trình AI dùng AWS Bedrock (Qwen3) | AWS credentials |
| `batch-generate-hints` | Sinh hint bí ẩn cho locations dùng Claude Haiku | Anthropic API key |

### 8.1 Set secrets cho Edge Functions

```bash
# AWS credentials cho plan-trip
npx supabase secrets set \
  AWS_ACCESS_KEY_ID=<your_aws_access_key> \
  AWS_SECRET_ACCESS_KEY=<your_aws_secret_key> \
  AWS_REGION=ap-southeast-2 \
  --project-ref <YOUR_PROJECT_REF>

# Anthropic key cho batch-generate-hints
npx supabase secrets set \
  ANTHROPIC_API_KEY=<your_anthropic_key> \
  --project-ref <YOUR_PROJECT_REF>

# (Tùy chọn) Override Bedrock model
npx supabase secrets set \
  BEDROCK_MODEL_ID=qwen.qwen3-235b-a22b-2507-v1:0 \
  --project-ref <YOUR_PROJECT_REF>
```

> `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` được Supabase inject tự động — không cần set thủ công.

Kiểm tra secrets đã set:

```bash
npx supabase secrets list --project-ref <YOUR_PROJECT_REF>
```

### 8.2 Deploy plan-trip

```bash
npx supabase functions deploy plan-trip --project-ref <YOUR_PROJECT_REF>
```

Test thử:

```bash
curl -X POST \
  https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/plan-trip \
  -H "Authorization: Bearer <USER_JWT_OR_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Hà Nội",
    "days": 2,
    "budget_per_person": 200000,
    "group_size": 2,
    "vibes": ["Văn hóa", "Ẩm thực"]
  }'
```

Kết quả mong đợi: JSON có field `days` với array các slot.

### 8.3 Deploy batch-generate-hints

```bash
npx supabase functions deploy batch-generate-hints --project-ref <YOUR_PROJECT_REF>
```

**Chạy một lần sau khi seed locations** để tự động sinh hint cho tất cả locations chưa có hint:

```bash
curl -X POST \
  https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/batch-generate-hints \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

Kết quả: `{ "message": "Processed X locations", "success": Y, "failed": Z }`

> Function xử lý theo batch 5, có delay 1 giây giữa các batch để tránh rate limit.
> Với 73 locations, quá trình mất khoảng 2–3 phút.

### 8.4 Kiểm tra sau deploy

```sql
-- Xem bao nhiêu locations đã có hint
SELECT
  COUNT(*) FILTER (WHERE hint IS NOT NULL) AS has_hint,
  COUNT(*) FILTER (WHERE hint IS NULL) AS no_hint,
  COUNT(*) AS total
FROM public.locations WHERE is_active = true;
```

---

## 9. Cấu hình biến môi trường cho app

Tạo file `.env.local` ở thư mục gốc dự án (cùng cấp với `package.json`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<YOUR_ANON_KEY>
```

> File `.env.local` đã được gitignore — không commit lên repo.

Kiểm tra app đọc đúng URL:

```bash
npx expo start
# Mở Expo DevTools → Network tab → kiểm tra request đến đúng Supabase URL
```

---

## 10. Checklist kiểm tra sau triển khai

### Authentication

- [ ] Đăng ký bằng email mới → nhận OTP → confirm → tạo được session
- [ ] Bảng `profiles` tự tạo row với `full_name` đúng
- [ ] Đăng nhập lại → session được restore (không logout khi restart app)
- [ ] Đăng xuất → xóa session

### Database

- [ ] `SELECT COUNT(*) FROM public.locations WHERE is_active = true` trả về > 0
- [ ] `SELECT * FROM public.trips LIMIT 1` chỉ trả về trips của user hiện tại (RLS hoạt động)
- [ ] Tạo trip → `trip_items` insert được, `trip_journals` insert được

### Edge Functions

- [ ] `plan-trip` trả về JSON hợp lệ với `days` array
- [ ] Các `location_id` trong response có trong bảng `locations`
- [ ] `batch-generate-hints` điền `hint` cho locations

### Storage

- [ ] Upload ảnh vào `trip-covers` → nhận được public URL
- [ ] URL ảnh load được trong `<Image source={{ uri: ... }}>`
- [ ] User khác không xóa được file của user này

### App flow

- [ ] Home screen load locations từ DB (không còn dùng mock data)
- [ ] Tap vào location card → detail screen hiện đúng thông tin từ DB
- [ ] Workspace → Tạo bằng AI → timeline hiện đúng locations của destination
- [ ] Trip detail → tap item → hiện "Tại sao AI chọn?" nếu có `ai_reason`
- [ ] Thêm location thủ công vào trip → hiện đúng tên location trong timeline

---

## 11. Xử lý sự cố thường gặp

### Lỗi: `JWT expired` hoặc `Invalid JWT`

**Nguyên nhân:** Sai anon key hoặc key đã rotate.

**Xử lý:**
1. Vào **Project Settings → API** → copy lại key
2. Cập nhật `.env.local`
3. Restart Metro: `npx expo start --clear`

---

### Lỗi: `permission denied for table locations`

**Nguyên nhân:** RLS policy chưa tạo.

**Xử lý:** Chạy lại migration 10 hoặc thêm policy thủ công:

```sql
CREATE POLICY "Locations are public"
  ON public.locations FOR SELECT USING (true);
```

---

### Lỗi: `Edge function returned status 500` (plan-trip)

**Nguyên nhân thường gặp:**
1. AWS credentials sai/thiếu quyền `bedrock:InvokeModel`
2. Model ID không tồn tại ở region đã chọn

**Xử lý:**
```bash
# Xem logs Edge Function
npx supabase functions logs plan-trip --project-ref <YOUR_PROJECT_REF>
```

Kiểm tra AWS IAM policy có chứa:
```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": "arn:aws:bedrock:ap-southeast-2::foundation-model/*"
}
```

---

### Lỗi: `plan-trip` trả về 0 locations

**Nguyên nhân:** Locations chưa có `address` match với destination, hoặc budget quá thấp.

**Xử lý:**
```sql
-- Kiểm tra locations của Hà Nội
SELECT id, name, address, price_per_person
FROM public.locations
WHERE address ILIKE '%Hà Nội%' AND is_active = true
LIMIT 5;
```

Nếu không có kết quả → address của locations không có "Hà Nội" → update hoặc dùng city/district.

---

### Lỗi: `batch-generate-hints` không sinh hint

**Nguyên nhân:** Locations thiếu `description` và `short_description`.

**Kiểm tra:**
```sql
SELECT COUNT(*) FROM public.locations
WHERE is_active = true
  AND description IS NULL
  AND short_description IS NULL;
```

Nếu > 0 → chạy migration 12 (`enrich_locations_fields.sql`) trước, sau đó invoke lại function.

---

### App không nhận env vars

**Nguyên nhân:** Expo cache cũ.

**Xử lý:**
```bash
npx expo start --clear
```

Hoặc xóa cache thủ công:
```bash
rm -rf .expo/
npx expo start
```

---

## Phụ lục: Sơ đồ kiến trúc backend

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase Project                      │
│                                                          │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │    Auth     │  │    Database     │  │   Storage   │ │
│  │  (GoTrue)   │  │  (PostgreSQL)   │  │             │ │
│  │             │  │                 │  │ trip-covers │ │
│  │ Email OTP   │  │ profiles        │  │ journal-    │ │
│  │ JWT tokens  │  │ trips           │  │ photos      │ │
│  │ Sessions    │  │ trip_items      │  │             │ │
│  │             │  │ trip_journals   │  └─────────────┘ │
│  └──────┬──────┘  │ locations       │                   │
│         │         │ bookmarks       │  ┌─────────────┐ │
│         │ trigger │ packing_items   │  │    Edge     │ │
│         └────────►│                 │  │  Functions  │ │
│                   │ RLS on all      │  │             │ │
│                   │ tables          │  │ plan-trip   │ │
│                   └────────────────-┘  │ batch-hints │ │
│                                        └──────┬──────┘ │
└───────────────────────────────────────────────┼─────────┘
                                                │
                              ┌─────────────────┼──────────────┐
                              │                 ▼              │
                              │   ┌─────────────────────────┐  │
                              │   │     External APIs       │  │
                              │   │  AWS Bedrock (Qwen3)    │  │
                              │   │  Anthropic (Claude      │  │
                              │   │  Haiku)                 │  │
                              │   └─────────────────────────┘  │
                              └───────────────────────────────--┘
```

---

*Tài liệu này phản ánh trạng thái backend tính đến ngày 25/06/2026.*
*Cập nhật khi thêm tables, functions, hoặc thay đổi auth flow.*
