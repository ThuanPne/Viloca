INSERT INTO festivals (name, location, cover_image, month, start_date, end_date, description, tags) VALUES

-- Tháng 2 — Hà Nội
(
  'Lễ hội Chùa Hương',
  'Mỹ Đức, Hà Nội',
  NULL, 2, '2027-02-13', '2027-04-13',
  'Lễ hội hành hương lớn nhất miền Bắc kéo dài 3 tháng — leo núi vãn cảnh, tham bái các chùa động huyền bí dọc suối Yến.',
  ARRAY['tâm linh', 'thiên nhiên', 'hà nội', 'hành hương']
),

-- Tháng 3 — Đà Nẵng (bổ sung cạnh Bánh Mì Hội An)
(
  'Lễ hội Cầu Ngư',
  'Quận Thanh Khê, Đà Nẵng',
  NULL, 3, '2027-03-20', '2027-03-21',
  'Lễ tế cá Ông linh thiêng của ngư dân ven biển Đà Nẵng — cầu bình an trên biển và mùa đánh bắt bội thu, với múa bông và hát bả trạo.',
  ARRAY['văn hóa', 'dân gian', 'đà nẵng', 'biển', 'tâm linh']
),

-- Tháng 4 — Đà Nẵng + Hà Nội
(
  'Carnival Đường phố Đà Nẵng',
  'Đường Bạch Đằng, Đà Nẵng',
  NULL, 4, '2027-04-25', '2027-04-30',
  'Lễ hội đường phố sôi động nhất miền Trung với diễu hành nghệ thuật, màn trình diễn ánh sáng và âm nhạc quốc tế suốt 5 đêm liên tiếp.',
  ARRAY['nghệ thuật', 'đường phố', 'đà nẵng', 'quốc tế', 'âm nhạc']
),
(
  'Giỗ Tổ Hùng Vương',
  'Hà Nội',
  NULL, 4, '2027-04-06', '2027-04-06',
  'Quốc lễ 10/3 âm lịch tưởng nhớ các Vua Hùng dựng nước — lễ dâng hương, diễu hành văn hóa trọng thể và nghỉ lễ toàn quốc.',
  ARRAY['lịch sử', 'văn hóa', 'quốc lễ', 'hà nội', 'truyền thống']
),

-- Tháng 5 — TP.HCM & Hà Nội
(
  'Đại lễ Phật Đản',
  'TP. Hồ Chí Minh & Hà Nội',
  NULL, 5, '2027-05-11', '2027-05-11',
  'Lễ kỷ niệm ngày sinh Đức Phật với rước đèn, thả hoa đăng trên sông và nghi lễ trang nghiêm tại hàng trăm ngôi chùa trên toàn quốc.',
  ARRAY['tâm linh', 'phật giáo', 'đèn lồng', 'toàn quốc']
),

-- Tháng 6 — Đà Nẵng
(
  'Lễ hội Biển Đà Nẵng',
  'Bãi biển Mỹ Khê, Đà Nẵng',
  NULL, 6, '2026-06-28', '2026-06-30',
  'Lễ hội mùa hè tại bãi biển đẹp nhất Việt Nam — biểu diễn âm nhạc, thể thao biển, bắn pháo hoa rực rỡ và các hoạt động cộng đồng sôi nổi.',
  ARRAY['biển', 'mùa hè', 'đà nẵng', 'âm nhạc', 'pháo hoa']
),

-- Tháng 7 — Hà Nội
(
  'Monsoon Music Festival',
  'Hoàng Thành Thăng Long, Hà Nội',
  NULL, 7, '2026-07-17', '2026-07-19',
  'Festival âm nhạc thế giới thường niên tại Hà Nội — nghệ sĩ quốc tế biểu diễn dưới trời mưa trong không gian di sản Hoàng Thành nghìn năm tuổi.',
  ARRAY['âm nhạc', 'quốc tế', 'hà nội', 'nghệ thuật', 'di sản']
),

-- Tháng 9 — Hội An + Hà Nội
(
  'Tết Trung Thu Phố Cổ Hội An',
  'Phố cổ Hội An',
  NULL, 9, '2026-09-25', '2026-09-25',
  'Đêm hội đèn lồng rực rỡ nhất Việt Nam — phố cổ tắt điện, trẻ em rước đèn và thuyền hoa thả trôi trên sông Hoài huyền ảo.',
  ARRAY['truyền thống', 'đèn lồng', 'hội an', 'trung thu', 'trẻ em']
),
(
  'Tết Trung Thu Phố Cổ Hà Nội',
  'Phố Hàng Mã, Hoàn Kiếm, Hà Nội',
  NULL, 9, '2026-09-25', '2026-09-25',
  'Phố Hàng Mã ngập tràn đèn lồng và đồ chơi dân gian — trung tâm lễ hội Tết Trung Thu lớn nhất Hà Nội với múa lân, bánh nướng và không khí gia đình.',
  ARRAY['truyền thống', 'trẻ em', 'hà nội', 'phố cổ', 'trung thu']
),

-- Tháng 11 — TP.HCM + Hội An
(
  'Lễ hội Áo Dài TP.HCM',
  'TP. Hồ Chí Minh',
  NULL, 11, '2026-11-28', '2026-12-06',
  'Tuần lễ Áo Dài thường niên với triển lãm, trình diễn thời trang và diễu hành áo dài rực rỡ trên phố đi bộ Nguyễn Huệ.',
  ARRAY['áo dài', 'văn hóa', 'thời trang', 'sài gòn', 'truyền thống']
),
(
  'Đêm Rằm Phố Cổ Hội An',
  'Phố cổ Hội An',
  NULL, 11, NULL, NULL,
  'Mỗi đêm rằm tháng 11, Hội An tắt điện thắp đèn lồng — không gian cổ tích với thuyền hoa, làn điệu dân ca và ánh nến bên sông Hoài.',
  ARRAY['văn hóa', 'hội an', 'đèn lồng', 'đêm rằm', 'phố cổ']
);
