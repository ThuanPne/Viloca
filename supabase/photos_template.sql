-- ============================================================
-- HƯỚNG DẪN SỬ DỤNG
-- ============================================================
-- 1. Tạo bucket "viloca-media" (public) trong Supabase Storage
-- 2. Upload ảnh theo cấu trúc folder bên dưới
-- 3. Thay <BASE> bằng URL gốc của project:
--    https://<project-ref>.supabase.co/storage/v1/object/public/viloca-media
-- 4. Chạy các lệnh UPDATE tương ứng
-- ============================================================

-- ============================================================
-- CẤU TRÚC FOLDER CẦN TẠO TRONG STORAGE
-- ============================================================
-- viloca-media/
-- ├── locations/
-- │   ├── SG/
-- │   │   ├── dinh-doc-lap/
-- │   │   ├── buu-dien-trung-tam/
-- │   │   ├── nha-hat-thanh-pho/
-- │   │   ├── bao-tang-lich-su/
-- │   │   ├── cho-ben-thanh/
-- │   │   └── bao-tang-chung-tich/
-- │   └── DN/
-- │       ├── ta-lang-gian-bi/
-- │       ├── the-hang-art/
-- │       ├── lang-toom-sara/
-- │       ├── giong-cafe/
-- │       ├── bao-tang-dieu-khac-cham/
-- │       ├── lang-cui-lu-hoi-an/
-- │       ├── homestay-alang-nhu/
-- │       ├── the-heritage-show/
-- │       ├── cong-vien-dat-nung/
-- │       ├── lang-moc-kim-bong/
-- │       ├── every-half/
-- │       ├── rung-dua-bay-mau/
-- │       ├── ngon-pho-da/
-- │       ├── ky-uc-hoi-an/
-- │       ├── hang-ganh/
-- │       ├── truc-lam-vien/
-- │       ├── cong-troi-dong-giang/
-- │       ├── ngon-thi-hoa/
-- │       ├── bep-cuon/
-- │       ├── bao-tang-sa-huynh/
-- │       ├── lang-rau-tra-que/
-- │       ├── nha-co-tan-ky/
-- │       ├── leaf-village-farm/
-- │       ├── the-farmers/
-- │       ├── hoi-quan-phuoc-kien/
-- │       ├── bao-tang-dong-dinh/
-- │       └── nha-go-villa/
-- ============================================================

-- Đặt BASE URL ở đây để dễ copy/paste
-- Ví dụ: https://abcdefgh.supabase.co/storage/v1/object/public/viloca-media

-- ============================================================
-- TP. HỒ CHÍ MINH (SG) — 6 địa điểm
-- ============================================================

UPDATE locations SET photos =
  '<BASE>/locations/SG/dinh-doc-lap/1.jpg'
WHERE city = 'SG' AND name = 'Dinh Độc Lập';

UPDATE locations SET photos =
  '<BASE>/locations/SG/buu-dien-trung-tam/1.jpg'
WHERE city = 'SG' AND name = 'Bưu Điện Trung Tâm Sài Gòn';

UPDATE locations SET photos =
  '<BASE>/locations/SG/nha-hat-thanh-pho/1.jpg'
WHERE city = 'SG' AND name = 'Nhà Hát Thành Phố Hồ Chí Minh';

UPDATE locations SET photos =
  '<BASE>/locations/SG/bao-tang-lich-su/1.jpg'
WHERE city = 'SG' AND name = 'Bảo Tàng Lịch Sử TP. Hồ Chí Minh';

UPDATE locations SET photos =
  '<BASE>/locations/SG/cho-ben-thanh/1.jpg'
WHERE city = 'SG' AND name = 'Chợ Bến Thành';

UPDATE locations SET photos =
  '<BASE>/locations/SG/bao-tang-chung-tich/1.jpg'
WHERE city = 'SG' AND name = 'Bảo Tàng Chứng Tích Chiến Tranh';


-- ============================================================
-- ĐÀ NẴNG + HỘI AN (DN) — 27 địa điểm
-- ============================================================

UPDATE locations SET photos =
  '<BASE>/locations/DN/ta-lang-gian-bi/1.jpg'
WHERE city = 'DN' AND name = 'Trung Tâm Văn Hóa Du Lịch Cộng Đồng Tà Lang - Giàn Bí';

UPDATE locations SET photos =
  '<BASE>/locations/DN/the-hang-art/1.jpg'
WHERE city = 'DN' AND name = 'The Hang Art';

UPDATE locations SET photos =
  '<BASE>/locations/DN/lang-toom-sara/1.jpg'
WHERE city = 'DN' AND name = 'Làng Toom Sara';

UPDATE locations SET photos =
  '<BASE>/locations/DN/giong-cafe/1.jpg'
WHERE city = 'DN' AND name = 'Gióng Café';

UPDATE locations SET photos =
  '<BASE>/locations/DN/bao-tang-dieu-khac-cham/1.jpg'
WHERE city = 'DN' AND name = 'Bảo Tàng Điêu Khắc Chăm';

UPDATE locations SET photos =
  '<BASE>/locations/DN/lang-cui-lu-hoi-an/1.jpg'
WHERE city = 'DN' AND name = 'Làng Củi Lũ Hội An (Driftwood Village)';

UPDATE locations SET photos =
  '<BASE>/locations/DN/homestay-alang-nhu/1.jpg'
WHERE city = 'DN' AND name = 'Homestay Alang Nhu';

UPDATE locations SET photos =
  '<BASE>/locations/DN/the-heritage-show/1.jpg'
WHERE city = 'DN' AND name = 'The Heritage Show';

UPDATE locations SET photos =
  '<BASE>/locations/DN/cong-vien-dat-nung/1.jpg'
WHERE city = 'DN' AND name = 'Công Viên Đất Nung Thanh Hà';

UPDATE locations SET photos =
  '<BASE>/locations/DN/lang-moc-kim-bong/1.jpg'
WHERE city = 'DN' AND name = 'Làng Mộc Kim Bồng';

UPDATE locations SET photos =
  '<BASE>/locations/DN/every-half/1.jpg'
WHERE city = 'DN' AND name = 'EVERY HALF';

UPDATE locations SET photos =
  '<BASE>/locations/DN/rung-dua-bay-mau/1.jpg'
WHERE city = 'DN' AND name = 'Rừng Dừa Bảy Mẫu';

UPDATE locations SET photos =
  '<BASE>/locations/DN/ngon-pho-da/1.jpg'
WHERE city = 'DN' AND name = 'Ngon Phố Đà';

UPDATE locations SET photos =
  '<BASE>/locations/DN/ky-uc-hoi-an/1.jpg'
WHERE city = 'DN' AND name = 'Ký Ức Hội An';

UPDATE locations SET photos =
  '<BASE>/locations/DN/hang-ganh/1.jpg'
WHERE city = 'DN' AND name = 'Hàng Gánh';

UPDATE locations SET photos =
  '<BASE>/locations/DN/truc-lam-vien/1.jpg'
WHERE city = 'DN' AND name = 'Nhà Hàng Café Trúc Lâm Viên';

UPDATE locations SET photos =
  '<BASE>/locations/DN/cong-troi-dong-giang/1.jpg'
WHERE city = 'DN' AND name = 'Cổng Trời Đông Giang';

UPDATE locations SET photos =
  '<BASE>/locations/DN/ngon-thi-hoa/1.jpg'
WHERE city = 'DN' AND name = 'Ngon Thị Hoa Restaurant';

UPDATE locations SET photos =
  '<BASE>/locations/DN/bep-cuon/1.jpg'
WHERE city = 'DN' AND name = 'Bếp Cuốn';

UPDATE locations SET photos =
  '<BASE>/locations/DN/bao-tang-sa-huynh/1.jpg'
WHERE city = 'DN' AND name = 'Bảo Tàng Văn Hóa Sa Huỳnh';

UPDATE locations SET photos =
  '<BASE>/locations/DN/lang-rau-tra-que/1.jpg'
WHERE city = 'DN' AND name = 'Làng Rau Trà Quế';

UPDATE locations SET photos =
  '<BASE>/locations/DN/nha-co-tan-ky/1.jpg'
WHERE city = 'DN' AND name = 'Nhà Cổ Tân Kỳ';

UPDATE locations SET photos =
  '<BASE>/locations/DN/leaf-village-farm/1.jpg'
WHERE city = 'DN' AND name = 'Leaf Village & Farm';

UPDATE locations SET photos =
  '<BASE>/locations/DN/the-farmers/1.jpg'
WHERE city = 'DN' AND name = 'The Farmers';

UPDATE locations SET photos =
  '<BASE>/locations/DN/hoi-quan-phuoc-kien/1.jpg'
WHERE city = 'DN' AND name = 'Hội Quán Phước Kiến';

UPDATE locations SET photos =
  '<BASE>/locations/DN/bao-tang-dong-dinh/1.jpg'
WHERE city = 'DN' AND name = 'Bảo Tàng Đồng Đình';

UPDATE locations SET photos =
  '<BASE>/locations/DN/nha-go-villa/1.jpg'
WHERE city = 'DN' AND name = 'Nhà Gỗ Villa';

-- ============================================================
-- NẾU 1 ĐỊA ĐIỂM CÓ NHIỀU ẢNH — nối bằng dấu phẩy
-- ============================================================
-- UPDATE locations SET photos =
--   '<BASE>/locations/DN/lang-toom-sara/1.jpg,'  ||
--   '<BASE>/locations/DN/lang-toom-sara/2.jpg,'  ||
--   '<BASE>/locations/DN/lang-toom-sara/3.jpg'
-- WHERE city = 'DN' AND name = 'Làng Toom Sara';
