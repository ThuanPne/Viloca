## Context

App hiện tại có tab "Khám phá" (`app/(app)/index.tsx`) với layout đơn giản: search bar tĩnh, category chips, featured experiences, experience list. Không có khái niệm "địa điểm" (places) hay "sự kiện" (festivals) là entity riêng. Design system cũ dùng green primary nhưng chưa theo Organic Nomad spec. `trips.destination` là free text — không thể aggregate chính xác.

UI reference: `stitch_hidden_gem_travel_app/Home_UI/screen.png` — editorial style, image-heavy.
Design token: `stitch_hidden_gem_travel_app/Template/DESIGN.md` — Organic Nomad palette.

## Goals / Non-Goals

**Goals:**
- Redesign hoàn toàn homepage với 3 section: Sự kiện, Nhóm địa điểm, Địa điểm nổi bật
- Sticky bottom search bar với filter sheet
- Chuẩn hóa `places` là entity riêng trong DB
- Áp dụng Organic Nomad design tokens (màu, font, spacing)
- Rename tab "Khám phá" → "Trang Chủ"

**Non-Goals:**
- Không build search results screen (chỉ build UI filter sheet)
- Không migrate `trips.destination` text cũ — giữ backward compat
- Không thay đổi experience detail, trip detail, workspace
- Không implement real-time festival countdown (dùng static tính toán khi render)

## Decisions

### 1. `places` là bảng độc lập, `trips.place_id` nullable

`trips.destination` (text) được giữ nguyên. Thêm `place_id UUID FK → places` nullable. Trip mới sẽ dùng `place_id`; trip cũ vẫn chạy được với `destination`.

Thay thế đã xem xét: migrate hết destination text → không khả thi vì data user đã có, và destination text có thể là tên tùy ý không khớp với places có sẵn.

### 2. Festival visibility logic thuần client-side

Logic tháng/ngày được tính tại render time từ `Date.now()`, không cần DB trigger hay realtime subscription. Đơn giản và đủ chính xác vì festivals không thay đổi theo giây.

```
month < currentMonth           → ẩn (đã qua trong năm nay)
month > currentMonth           → hiện "X tháng nữa"
month == currentMonth
  start_date == null           → hiện "Coming Soon"
  start_date >= today          → hiện "X ngày nữa"
  start_date < today           → ẩn (đã qua)
```

### 3. Sticky search bar dùng absolute/fixed positioning, không phải tab bar replacement

Search bar nằm phía trên tab bar, dùng `position: absolute, bottom: TAB_BAR_HEIGHT`. Backdrop blur bằng `expo-blur` hoặc `react-native-blur`. ScrollView content có `paddingBottom` đủ để không bị che.

Thay thế: floating button mở full-screen search → mất discoverability của filters.

### 4. "Địa điểm nổi bật" query từ Supabase

```sql
SELECT p.*, COUNT(t.id) as trip_count
FROM places p
LEFT JOIN trips t ON t.place_id = p.id
  AND t.status IN ('active', 'completed')
GROUP BY p.id
ORDER BY trip_count DESC
LIMIT 6
```

Thực hiện qua Supabase RPC hoặc view để tránh N+1. Ban đầu nếu trips còn ít, fallback về tất cả places sắp xếp alphabetically.

### 5. Design tokens cập nhật trong `src/theme/colors.ts`

Thêm Organic Nomad tokens mới (surface, cream, etc.) song song với tokens cũ — không xóa cũ để tránh break các screen khác. Homepage dùng token mới, các screen cũ vẫn dùng token cũ.

### 6. Font

Plus Jakarta Sans (headings) và Be Vietnam Pro (body) cần cài qua `expo-google-fonts` hoặc bundle thủ công. Fallback về `System` font nếu chưa load xong.

## Risks / Trade-offs

- **Font loading lag** → Dùng `useFonts` hook, show skeleton hoặc system font trong lúc chờ
- **places table chưa có data** → Địa điểm nổi bật sẽ trống; cần seed data trong migration
- **Supabase trip_count query chậm khi data lớn** → Thêm index `trips(place_id, status)`; có thể materialize view sau
- **Sticky search bar che content trên Android** → Test kỹ `paddingBottom` của ScrollView với các device size khác nhau
- **BlurView performance trên low-end Android** → Fallback về solid background với opacity nếu BlurView không support

## Migration Plan

1. Chạy Supabase migration: tạo `places`, `festivals`, thêm `place_id` nullable vào `trips`
2. Seed `places` với ~10 địa điểm phổ biến (Hội An, Đà Lạt, Phú Quốc, Đà Nẵng, Hà Nội, HCM, Sapa, Nha Trang, Huế, Hạ Long)
3. Seed `festivals` với ~5 lễ hội mẫu
4. Update `src/types/index.ts`
5. Update `src/theme/colors.ts`
6. Viết lại `app/(app)/index.tsx`
7. Update `app/(app)/_layout.tsx`

Rollback: revert migration, revert index.tsx từ git.

## Open Questions

- BlurView package nào đang dùng? (`expo-blur` hay `@react-native-community/blur`) — cần check package.json
- Filter search sheet khi tap → navigate đến search results screen riêng hay filter in-place trên homepage?
