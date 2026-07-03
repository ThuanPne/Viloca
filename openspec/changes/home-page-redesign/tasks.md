## 1. Database & Types

- [x] 1.1 Tạo Supabase migration: bảng `places` (id, name, slug, region enum, cover_image, description, experience_types[])
- [x] 1.2 Tạo Supabase migration: bảng `festivals` (id, name, location, cover_image, month, start_date nullable, end_date nullable, description, tags[])
- [x] 1.3 Tạo Supabase migration: thêm cột `place_id UUID REFERENCES places(id) ON DELETE SET NULL` nullable vào bảng `trips`
- [x] 1.4 Seed `places` với 10 địa điểm (Hội An, Đà Lạt, Phú Quốc, Đà Nẵng, Hà Nội, HCM, Sapa, Nha Trang, Huế, Hạ Long) — region, cover_image, experience_types
- [x] 1.5 Seed `festivals` với 5 lễ hội mẫu có tháng và trạng thái khác nhau để test logic hiển thị
- [x] 1.6 Thêm type `Place` và `Festival` vào `src/types/index.ts`; cập nhật `Trip` thêm field `place_id: string | null`

## 2. Design Tokens

- [x] 2.1 Cập nhật `src/theme/colors.ts`: thêm Organic Nomad palette (surface `#fafaf0`, primary `#45611b`, on-surface `#1a1c17`, outline `#75796a`, surface-container `#eeeee5`, etc.) — không xóa token cũ
- [x] 2.2 Cài font `expo-google-fonts` với Plus Jakarta Sans và Be Vietnam Pro (hoặc bundle thủ công); export `useFonts` hook

## 3. Tab & Layout Shell

- [x] 3.1 Cập nhật `app/(app)/_layout.tsx`: đổi title "Khám phá" → "Trang Chủ", icon `compass-outline` → `home-outline`
- [x] 3.2 Xóa toàn bộ code cũ của `app/(app)/index.tsx`, tạo component shell với `ScreenWrapper`, header "Viloca" + bell icon, ScrollView với `paddingBottom` đủ cho sticky search bar

## 4. Section: Sự kiện sắp diễn ra

- [x] 4.1 Tạo hook `useFestivals()` — query Supabase `festivals`, filter client-side theo logic tháng/ngày, trả về danh sách đã lọc
- [x] 4.2 Tạo component `FestivalCard` — ảnh cover full-width trong card, tên lễ hội, địa điểm, badge trạng thái (Coming Soon / X ngày nữa / X tháng nữa)
- [x] 4.3 Tích hợp section "Sự kiện sắp diễn ra" vào homepage với horizontal FlatList của FestivalCard

## 5. Section: Nhóm địa điểm

- [x] 5.1 Tạo tab switcher component [Khu vực | Loại trải nghiệm] theo Organic Nomad style (active tab: primary green underline)
- [x] 5.2 Tab Khu vực: 3 sub-chips [Miền Bắc | Miền Trung | Miền Nam] → filter places theo `region`; hiển thị horizontal place cards
- [x] 5.3 Tab Loại trải nghiệm: chips [Ẩm thực | Checkin | Trekking | Workshop | Văn hóa] → filter places theo `experience_types`; hiển thị horizontal place cards
- [x] 5.4 Tạo component `PlaceCard` — ảnh cover, tên địa điểm, vùng miền label, Organic Nomad card style (shadow mờ, radius 16px, không border)

## 6. Section: Địa điểm nổi bật

- [x] 6.1 Tạo Supabase query (hoặc RPC) trả về top 6 places ranked theo số trip `active`/`completed`; fallback alphabetical nếu chưa có data
- [x] 6.2 Tạo hook `useFeaturedPlaces()` gọi query trên
- [x] 6.3 Tích hợp section "Địa điểm nổi bật" vào homepage với horizontal FlatList dùng lại `PlaceCard` (có thể biến thể lớn hơn)

## 7. Sticky Search Bar

- [x] 7.1 Tạo component `HomeSearchBar` — search input + 5 filter chips (Hashtag, TP, Vibe, Địa điểm, Nhóm HĐ), blur backdrop dùng `expo-blur`
- [x] 7.2 Đặt `HomeSearchBar` ở vị trí absolute/fixed phía trên tab bar; tính toán `bottom` offset đúng với tab bar height
- [x] 7.3 Tạo `FilterSheet` bottom sheet component — dismiss bằng swipe down hoặc tap backdrop; các tab filter tương ứng với 5 chips
- [x] 7.4 Kết nối tap search bar / chip → mở `FilterSheet` đúng section

## 8. Polish & QA

- [ ] 8.1 Test sticky search bar trên Android — kiểm tra `paddingBottom` ScrollView không bị che
- [ ] 8.2 Test festival logic với các tháng khác nhau (mock Date hoặc đổi seed data)
- [ ] 8.3 Test fallback font nếu Plus Jakarta Sans chưa load
- [ ] 8.4 Kiểm tra section "Địa điểm nổi bật" khi places chưa có trip data (fallback alphabetical)
- [ ] 8.5 Verify tab rename hiển thị đúng trên cả iOS và Android
<!-- QA tasks 8.1–8.5: cần chạy app thực tế để verify -->
