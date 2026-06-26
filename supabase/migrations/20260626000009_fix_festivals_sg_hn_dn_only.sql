-- Xóa các festival không thuộc SG / HN / DN
DELETE FROM festivals WHERE name IN ('Lễ hội Kate', 'Lễ hội Hoa Đà Lạt');

-- Thêm thay thế cho tháng 10 và 12
INSERT INTO festivals (name, location, cover_image, month, start_date, end_date, description, tags) VALUES

-- Tháng 10 — Hà Nội
(
  'Ngày Giải Phóng Thủ Đô',
  'Hồ Hoàn Kiếm, Hà Nội',
  NULL, 10, '2026-10-10', '2026-10-10',
  'Kỷ niệm ngày 10/10/1954 — Hà Nội tổ chức diễu hành, biểu diễn nghệ thuật và bắn pháo hoa hoành tráng quanh Hồ Hoàn Kiếm.',
  ARRAY['lịch sử', 'hà nội', 'pháo hoa', 'quốc lễ']
),

-- Tháng 12 — TP.HCM + Đà Nẵng
(
  'Giáng Sinh Nhà Thờ Đức Bà',
  'Quận 1, TP. Hồ Chí Minh',
  NULL, 12, '2026-12-24', '2026-12-25',
  'Đêm Giáng sinh tại quảng trường Nhà Thờ Đức Bà — hàng chục nghìn người đổ ra đường, trang trí rực rỡ và không khí lễ hội sôi động nhất Sài Gòn.',
  ARRAY['giáng sinh', 'sài gòn', 'đêm', 'lễ hội', 'quốc tế']
),
(
  'Countdown Cầu Rồng Đà Nẵng',
  'Cầu Rồng, Đà Nẵng',
  NULL, 12, '2026-12-31', '2027-01-01',
  'Đêm giao thừa hoành tráng tại cầu Rồng phun lửa — pháo hoa rực sáng bầu trời bên sông Hàn và countdown chào năm mới.',
  ARRAY['năm mới', 'đà nẵng', 'pháo hoa', 'cầu rồng', 'đêm']
);
