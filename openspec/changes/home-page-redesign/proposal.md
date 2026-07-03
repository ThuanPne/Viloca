## Why

Tab "Khám phá" hiện tại có layout đơn giản chưa thể hiện được giá trị khám phá của app, thiếu thông tin sự kiện theo mùa và chưa có khái niệm địa điểm (places) như một thực thể riêng. Cần redesign thành "Trang Chủ" với nội dung phong phú hơn, đúng brand Organic Nomad, và bổ sung hai data model mới (places, festivals).

## What Changes

- Đổi tên tab "Khám phá" → "Trang Chủ" (icon: home-outline)
- Xóa toàn bộ layout cũ của `app/(app)/index.tsx`
- Áp dụng design system Organic Nomad: nền cream `#fafaf0`, primary green `#45611b`, font Plus Jakarta Sans + Be Vietnam Pro
- Thêm **sticky bottom search bar** với blur backdrop và filter sheet (Hashtag, TP, Vibe, tên địa điểm, nhóm hoạt động)
- Thêm section **Sự kiện sắp diễn ra**: horizontal scroll cards từ bảng `festivals`, logic coming soon / đếm ngược / ẩn nếu đã qua
- Thêm section **Nhóm địa điểm**: tab switcher [Khu vực | Loại trải nghiệm] với sub-chips và place cards
- Thêm section **Địa điểm nổi bật**: ranked theo số trip `active`/`completed` liên kết với place
- **BREAKING** Bảng `trips`: thêm cột `place_id FK → places` (giữ `destination` text để backward compat)
- Thêm bảng `places` (id, name, slug, region, cover_image, description, experience_types[])
- Thêm bảng `festivals` (id, name, location, cover_image, month, start_date, end_date, description, tags[])

## Capabilities

### New Capabilities

- `home-screen`: Trang chủ với 3 section nội dung, header, và sticky search bar
- `places`: Data model địa điểm — bảng DB, TypeScript type, Supabase query
- `festivals`: Data model sự kiện theo mùa — bảng DB, logic hiển thị theo tháng
- `home-search`: Sticky search bar với filter sheet đa tiêu chí

### Modified Capabilities

- `register-validation`: Không thay đổi yêu cầu spec

## Impact

- `app/(app)/index.tsx` — viết lại hoàn toàn
- `app/(app)/_layout.tsx` — đổi tên tab và icon
- `src/types/index.ts` — thêm `Place`, `Festival` types; cập nhật `Trip` với `place_id`
- `src/theme/colors.ts` — cập nhật token theo Organic Nomad palette
- `supabase/migrations/` — migration tạo `places`, `festivals`, thêm `place_id` vào `trips`
- Không ảnh hưởng auth flow, trip detail, hay experience detail
