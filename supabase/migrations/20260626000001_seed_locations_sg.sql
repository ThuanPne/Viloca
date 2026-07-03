-- Seed: Saigon (SG) locations
INSERT INTO locations (city, name, district, address, google_maps_url, category, style_tag, price_level, opening_hours, closing_hours, off_days, phone, short_description, long_description, photos, verified, is_active)
VALUES
  (
    'SG', 'Dinh Độc Lập', 'Bến Thành',
    'Bến Thành, Quận 1, Hồ Chí Minh',
    'https://maps.app.goo.gl/G6abi9xZiabLJzfHA',
    'Trải nghiệm, Di tích lịch sử',
    'Trang nghiêm, Thoáng đãng, Lịch sử, Cổ kính',
    1, '07:00', '18:00', 'Dịp lễ lớn', '+84 28 3822 3652',
    NULL,
    'Di tích quốc gia đặc biệt - nơi chứng kiến bước ngoặt lịch sử ngày 30/4/1975.',
    NULL, true, true
  ),
  (
    'SG', 'Bưu Điện Trung Tâm Sài Gòn', 'Quận 1',
    '02 Công trường Công xã Paris, Bến Nghé, Quận 1, Hồ Chí Minh',
    'https://maps.app.goo.gl/dFGAuhymuLxB3EQUA',
    'Trải nghiệm, Kiến trúc cổ',
    'Cổ điển, Nhộn nhịp, Kiến trúc Pháp, Hoài cổ',
    1, 'T2-T6 07:30 / CN 08:00', 'T2-T6 18:00 / CN 17:00', 'Không nghỉ', NULL,
    NULL,
    'Công trình kiến trúc Phục Hưng Gothic độc đáo hơn 130 năm tuổi giữa lòng Sài Gòn.',
    NULL, true, true
  ),
  (
    'SG', 'Nhà Hát Thành Phố Hồ Chí Minh', 'Quận 1',
    '07 Công trường Lam Sơn, Quận 1, Hồ Chí Minh',
    'https://maps.app.goo.gl/8RPy3MHXvhUAcYEM6',
    'Trải nghiệm, Nghệ thuật',
    'Sang trọng, Cổ kính, Nghệ thuật, Lộng lẫy',
    3, 'Tùy lịch biểu diễn', 'Tùy lịch biểu diễn', 'Không nghỉ', NULL,
    'Biểu tượng văn hóa nghệ thuật đỉnh cao - mang đậm phong cách Tây Âu cổ điển.',
    'Nhà hát opera tinh xảo từ thời Pháp thuộc vào thế kỷ 19 - nay là nơi biểu diễn ba lê và nhạc giao hưởng của thành phố.',
    NULL, true, true
  ),
  (
    'SG', 'Bảo Tàng Lịch Sử TP. Hồ Chí Minh', 'Quận 1',
    '2 Nguyễn Bỉnh Khiêm, Quận 1, Hồ Chí Minh',
    'https://maps.app.goo.gl/2KXJrRq3tGud8WP2A',
    'Trải nghiệm, Lịch sử',
    'Yên tĩnh, Sâu lắng, Giáo dục, Cổ xưa',
    1, '08:00 / 13:00', '11:30 / 17:00', 'Thứ 2', '+84 28 3825 8783',
    'Nơi lưu giữ và tái hiện hàng ngàn năm lịch sử - văn hóa Việt Nam và Nam Bộ.',
    'Quần thể rộng lớn kiểu Trung Hoa với các hiện vật và tác phẩm nghệ thuật Việt Nam từ thời tiền sử đến hiện đại.',
    NULL, true, true
  ),
  (
    'SG', 'Chợ Bến Thành', 'Quận 1',
    'Bến Thành, Quận 1, Hồ Chí Minh',
    'https://maps.app.goo.gl/qn6rVPvwW86rz527A',
    'Ẩm thực, Mua sắm, Văn hóa',
    'Đông đúc, Nhộn nhịp, Đa dạng, Đậm chất Sài Gòn',
    1, '06:00', '22:00', 'Không nghỉ', NULL,
    'Ngôi chợ biểu tượng lâu đời nhất Sài Gòn - trung tâm giao thương và văn hóa ẩm thực.',
    'Chợ nổi tiếng để mua đồ thủ công, lưu niệm, quần áo và hàng hóa khác - đồng thời thưởng thức ẩm thực địa phương.',
    NULL, true, true
  ),
  (
    'SG', 'Bảo Tàng Chứng Tích Chiến Tranh', 'Quận 3',
    'Phường 6, Quận 3, Hồ Chí Minh',
    'https://maps.app.goo.gl/AhhtxZLT7vvPMrDG8',
    'Trải nghiệm, Lịch sử',
    'Trầm mặc, Xúc động, Giáo dục, Quốc tế',
    1, '07:30', '17:30', 'Không nghỉ', '+84 28 3930 5587',
    NULL,
    'Bảo tàng tưởng niệm trưng bày ảnh - vũ khí và vật phẩm từ các cuộc chiến tại Việt Nam và Đông Dương.',
    NULL, true, true
  );
