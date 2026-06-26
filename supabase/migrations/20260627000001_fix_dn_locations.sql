-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Xóa địa điểm không phù hợp
-- ──────────────────────────────────────────────────────────────────────────────
DELETE FROM locations WHERE city = 'DN' AND name IN (
  'Laque Restaurant & Coffee',
  'Bar Đồ Yêu - Authentic Vietnamese Cocktail',
  'Ba Na Hills'
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Sửa tên quận / địa danh không chính xác
--    • "Hải Vân" không phải quận/huyện — Hòa Bắc thuộc huyện Hòa Vang
--    • "Bà Nà" không phải quận/huyện — khu vực này thuộc huyện Hòa Vang
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE locations SET district = 'Hòa Vang'
WHERE city = 'DN' AND name IN (
  'Trung Tâm Văn Hóa Du Lịch Cộng Đồng Tà Lang - Giàn Bí',
  'Homestay Alang Nhu',
  'The Farmers'
);

-- Leaf Village nằm phía đèo Hải Vân thuộc quận Liên Chiểu (phía Đà Nẵng)
UPDATE locations SET district = 'Liên Chiểu'
WHERE city = 'DN' AND name = 'Leaf Village & Farm';

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Cập nhật style_tag cho 27 địa điểm còn lại
-- ──────────────────────────────────────────────────────────────────────────────

-- Trải nghiệm / Cộng đồng / Thiên nhiên
UPDATE locations SET style_tag = 'Yên bình, Bản địa, Cắm trại, Trekking, Suối rừng, Văn hóa Cơ Tu'
WHERE city = 'DN' AND name = 'Trung Tâm Văn Hóa Du Lịch Cộng Đồng Tà Lang - Giàn Bí';

UPDATE locations SET style_tag = 'Du lịch cộng đồng, Văn hóa Cơ Tu, Thiên nhiên, Cắm trại, Trekking, BBQ'
WHERE city = 'DN' AND name = 'Làng Toom Sara';

UPDATE locations SET style_tag = 'Sinh thái, Văn hóa Cơ Tu, Bản địa, Nghỉ dưỡng, Núi rừng'
WHERE city = 'DN' AND name = 'Homestay Alang Nhu';

UPDATE locations SET style_tag = 'Sinh thái chữa lành, Nông trại, Suối rừng, Cắm trại, Yên tĩnh'
WHERE city = 'DN' AND name = 'Leaf Village & Farm';

UPDATE locations SET style_tag = 'Thiên nhiên, Nông trại ngoại ô, Thư giãn, Gia đình, Cuối tuần'
WHERE city = 'DN' AND name = 'The Farmers';

UPDATE locations SET style_tag = 'Sinh thái sông nước, Thuyền thúng, Rừng dừa, Địa phương, Hội An'
WHERE city = 'DN' AND name = 'Rừng Dừa Bảy Mẫu';

UPDATE locations SET style_tag = 'Sinh thái núi rừng, Văn hóa Cơ Tu, Cáp treo, Cầu kính, Mạo hiểm'
WHERE city = 'DN' AND name = 'Cổng Trời Đông Giang';

-- Workshop / Nghệ thuật thủ công
UPDATE locations SET style_tag = 'Nghệ thuật đương đại, Workshop thủ công, Kiến trúc tối giản, Cà phê, Văn hóa Việt'
WHERE city = 'DN' AND name = 'The Hang Art';

UPDATE locations SET style_tag = 'Nghệ thuật tái chế, Workshop thủ công, Văn hóa địa phương, Bền vững, Hội An'
WHERE city = 'DN' AND name = 'Làng Củi Lũ Hội An (Driftwood Village)';

UPDATE locations SET style_tag = 'Thủ công truyền thống, Gốm đất nung, Làng nghề, Nghệ thuật, Hội An'
WHERE city = 'DN' AND name = 'Công Viên Đất Nung Thanh Hà';

UPDATE locations SET style_tag = 'Chạm khắc gỗ, Làng nghề, Di sản UNESCO, Thủ công truyền thống, Hội An'
WHERE city = 'DN' AND name = 'Làng Mộc Kim Bồng';

UPDATE locations SET style_tag = 'Làng nghề, Nông nghiệp hữu cơ, Trải nghiệm nông nghiệp, Yên tĩnh, Hội An'
WHERE city = 'DN' AND name = 'Làng Rau Trà Quế';

-- Nghệ thuật biểu diễn
UPDATE locations SET style_tag = 'Show diễn, Di sản miền Trung, Nghệ thuật đương đại, Âm nhạc, Đêm'
WHERE city = 'DN' AND name = 'The Heritage Show';

UPDATE locations SET style_tag = 'Show thực cảnh, Di sản văn hóa, Ngoài trời, Ánh sáng, Đêm, Hội An'
WHERE city = 'DN' AND name = 'Ký Ức Hội An';

-- Tham quan / Di sản / Bảo tàng
UPDATE locations SET style_tag = 'Bảo tàng, Văn minh Chămpa, Điêu khắc, Lịch sử, Di sản'
WHERE city = 'DN' AND name = 'Bảo Tàng Điêu Khắc Chăm';

UPDATE locations SET style_tag = 'Bảo tàng, Văn hóa Sa Huỳnh, Khảo cổ, Lịch sử cổ đại, Di sản Hội An'
WHERE city = 'DN' AND name = 'Bảo Tàng Văn Hóa Sa Huỳnh';

UPDATE locations SET style_tag = 'Bảo tàng, Văn hóa hoài niệm, Nghệ thuật, Đồ cổ, Thiên nhiên'
WHERE city = 'DN' AND name = 'Bảo Tàng Đồng Đình';

UPDATE locations SET style_tag = 'Di sản UNESCO, Kiến trúc giao thoa, Hội An cổ, Bảo tàng, Cổ kính'
WHERE city = 'DN' AND name = 'Nhà Cổ Tân Kỳ';

UPDATE locations SET style_tag = 'Di sản UNESCO, Kiến trúc Trung Hoa, Tâm linh, Cổ kính, Hội An'
WHERE city = 'DN' AND name = 'Hội Quán Phước Kiến';

-- Café / Cà phê
UPDATE locations SET style_tag = 'Cà phê rang xay, Văn hóa Hội An, Mộc mạc, Thư giãn, Phố cổ'
WHERE city = 'DN' AND name = 'Gióng Café';

UPDATE locations SET style_tag = 'Specialty coffee, Tối giản, Yên tĩnh, Văn hóa cà phê Việt, Hội An'
WHERE city = 'DN' AND name = 'EVERY HALF';

-- Ẩm thực
UPDATE locations SET style_tag = 'Ẩm thực miền Trung, Nhà hàng, Gần biển, Yên tĩnh, Gia đình'
WHERE city = 'DN' AND name = 'Ngon Phố Đà';

UPDATE locations SET style_tag = 'Ẩm thực truyền thống, Văn hóa gánh hàng, Ẩm thực đường phố, Mộc mạc'
WHERE city = 'DN' AND name = 'Hàng Gánh';

UPDATE locations SET style_tag = 'Ẩm thực Huế, Kiến trúc Huế, Nhà rường cổ, Sân vườn, Cổ kính'
WHERE city = 'DN' AND name = 'Nhà Hàng Café Trúc Lâm Viên';

UPDATE locations SET style_tag = 'Ẩm thực Việt ba miền, Hoài cổ, Sân vườn, Ấm cúng, Gia đình'
WHERE city = 'DN' AND name = 'Ngon Thị Hoa Restaurant';

UPDATE locations SET style_tag = 'Ẩm thực Việt truyền thống, Bánh cuốn, Đặc sản địa phương, Mộc mạc'
WHERE city = 'DN' AND name = 'Bếp Cuốn';

UPDATE locations SET style_tag = 'Ẩm thực Việt, Rang xay thủ công, Hội An, Mộc mạc, Phố cổ'
WHERE city = 'DN' AND name = 'Laque Restaurant & Coffee'; -- đã xóa, không cần nhưng vô hại

-- Lưu trú
UPDATE locations SET style_tag = 'Glamping, Kiến trúc gỗ, Hồ bơi riêng, Sang trọng, Yên tĩnh'
WHERE city = 'DN' AND name = 'Nhà Gỗ Villa';
