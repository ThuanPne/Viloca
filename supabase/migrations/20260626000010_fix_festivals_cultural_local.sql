-- Xóa các sự kiện thương mại / quốc tế không mang tính văn hóa địa phương
DELETE FROM festivals WHERE name IN (
  'Carnival Đường phố Đà Nẵng',
  'Lễ hội Biển Đà Nẵng',
  'Monsoon Music Festival',
  'Countdown Cầu Rồng Đà Nẵng',
  'Giáng Sinh Nhà Thờ Đức Bà'
);

-- Thay thế bằng lễ hội văn hóa dân gian địa phương
INSERT INTO festivals (name, location, cover_image, month, start_date, end_date, description, tags) VALUES

-- Tháng 6 — Tết Đoan Ngọ (toàn quốc, đặc sắc tại HN & SG)
(
  'Tết Đoan Ngọ',
  'Hà Nội & TP. Hồ Chí Minh',
  NULL, 6, '2026-06-17', '2026-06-17',
  '"Tết diệt sâu bọ" mồng 5 tháng 5 âm lịch — gia đình sum họp ăn rượu nếp, bánh ú, trái cây đầu mùa theo phong tục dân gian ngàn năm.',
  ARRAY['truyền thống', 'gia đình', 'ẩm thực', 'dân gian']
),

-- Tháng 7 — Lễ Kỳ Yên (đặc trưng Nam Bộ / SG)
(
  'Lễ Kỳ Yên',
  'Các đình làng, TP. Hồ Chí Minh',
  NULL, 7, NULL, NULL,
  'Lễ cầu an truyền thống của cộng đồng Nam Bộ tại các đình làng — hát bội, múa mâm vàng, dâng lễ vật và cầu nguyện bình an, mùa màng bội thu.',
  ARRAY['tâm linh', 'dân gian', 'nam bộ', 'sài gòn', 'đình làng']
),

-- Tháng 8 — Lễ Vu Lan Báo Hiếu (HN & SG)
(
  'Lễ Vu Lan Báo Hiếu',
  'Các chùa tại TP. Hồ Chí Minh & Hà Nội',
  NULL, 8, '2026-08-25', '2026-08-25',
  'Rằm tháng 7 âm lịch — con cái cài hoa hồng tưởng nhớ cha mẹ, thả đèn hoa đăng trên sông và dâng lễ tại các ngôi chùa lớn khắp cả nước.',
  ARRAY['phật giáo', 'tâm linh', 'gia đình', 'truyền thống']
),

-- Tháng 12 — Chợ Hoa Tết (HN & SG)
(
  'Chợ Hoa Tết Hàng Lược',
  'Phố Hàng Lược, Hoàn Kiếm, Hà Nội',
  NULL, 12, '2026-12-20', '2027-01-15',
  'Phiên chợ hoa trăm năm tuổi của người Hà Nội — hoa đào, quất cảnh và đồ trang trí Tết tràn ngập phố cổ, mở từ 23 tháng Chạp đến chiều 30.',
  ARRAY['tết', 'hoa', 'phố cổ', 'hà nội', 'truyền thống']
),
(
  'Đường Hoa Nguyễn Huệ',
  'Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  NULL, 12, '2026-12-28', '2027-01-29',
  'Đường hoa Tết Nguyễn Huệ lung linh mỗi dịp xuân về — triển lãm hoa nghệ thuật lớn nhất Sài Gòn thu hút hàng triệu người đến tham quan và chụp ảnh.',
  ARRAY['tết', 'hoa', 'sài gòn', 'nghệ thuật', 'truyền thống']
);
