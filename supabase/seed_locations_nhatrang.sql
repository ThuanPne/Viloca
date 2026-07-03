-- Seed: 5 locations in Nha Trang, Khánh Hòa
-- Run AFTER supabase/migrations/20260625000001_patch_locations_columns.sql

INSERT INTO public.locations
  (id, name, address, category, vibes, price_per_person, duration_minutes, rating, hint, cover_image, description, is_active)
VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'Tháp Bà Ponagar',
    '2 Tháng 4, Vĩnh Phước, Nha Trang, Khánh Hòa',
    'di tích',
    ARRAY['Cổ kính', 'Văn hóa', 'Bình yên'],
    22000,
    75,
    4.5,
    'Những ngọn tháp đỏ gạch đứng sừng sững suốt hơn nghìn năm, lặng yên chứng kiến bao cuộc đổi dời. Khói hương quyện lên từ lòng đất, mang theo lời cầu nguyện của những người phụ nữ đến đây từ thế hệ này sang thế hệ khác.',
    'https://picsum.photos/seed/ponagar/800/400',
    'Tháp Bà Ponagar là quần thể tháp Chăm cổ xây dựng từ thế kỷ 7-12. Đây là nơi thờ Mẹ xứ sở Thiên Y A Na. Kiến trúc gạch nung độc đáo, vẫn còn nguyên vẹn sau hơn 1000 năm.',
    true
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'Đảo Hòn Mun',
    'Vịnh Nha Trang, Khánh Hòa (cách bờ ~10km)',
    'thiên nhiên',
    ARRAY['Hoang sơ', 'Mạo hiểm', 'Bình yên'],
    350000,
    240,
    4.7,
    'Dưới làn nước trong vắt, một thế giới hoàn toàn khác đang tồn tại — màu sắc rực rỡ, im lặng tuyệt đối, chỉ có tiếng sóng nhẹ và hơi thở của bạn. Nơi mà thời gian dường như đứng yên.',
    'https://picsum.photos/seed/honmun/800/400',
    'Hòn Mun là khu bảo tồn biển quốc gia, nổi tiếng với san hô và sinh vật biển đa dạng. Nước trong xanh độ sâu 15-20m vẫn nhìn thấy đáy. Tour lặn snorkel và scuba diving phổ biến.',
    true
  ),
  (
    'a1b2c3d4-0003-0003-0003-000000000003',
    'Chợ Đầm Nha Trang',
    'Chợ Đầm, Phương Sài, Nha Trang, Khánh Hòa',
    'ẩm thực',
    ARRAY['Ẩm thực', 'Văn hóa'],
    120000,
    90,
    4.2,
    'Tiếng rao hàng, mùi hải sản tươi sống, màu sắc của hoa quả nhiệt đới — tất cả tạo nên một bức tranh hỗn độn mà cuốn hút. Người địa phương đến đây không chỉ để mua bán mà còn để gặp gỡ và kể chuyện.',
    'https://picsum.photos/seed/chodam/800/400',
    'Chợ Đầm là chợ trung tâm lớn nhất Nha Trang, tập trung hải sản tươi sống, đặc sản địa phương như yến sào, nước mắm. Tầng trên có khu ẩm thực với bún cá, bánh căn, nem nướng đặc trưng.',
    true
  ),
  (
    'a1b2c3d4-0004-0004-0004-000000000004',
    'Bãi Dài Cam Ranh',
    'Cam Hải Đông, Cam Lâm, Khánh Hòa',
    'thiên nhiên',
    ARRAY['Bình yên', 'Hoang sơ'],
    0,
    180,
    4.6,
    'Một dải cát trắng dài đến mức bạn không thể thấy điểm cuối, sóng biển vỗ nhẹ như tiếng thở đều đặn của đại dương đang ngủ. Buổi sáng sớm, bạn có thể có cả bãi biển này cho riêng mình.',
    'https://picsum.photos/seed/baidai/800/400',
    'Bãi Dài là bãi biển hoang sơ dài ~10km, cát trắng mịn, nước trong xanh, sóng nhẹ. Ít khách du lịch hơn bãi Nha Trang trung tâm. Phù hợp nghỉ dưỡng yên tĩnh, chụp ảnh bình minh.',
    true
  ),
  (
    'a1b2c3d4-0005-0005-0005-000000000005',
    'Làng Chài Vĩnh Lương',
    'Vĩnh Lương, Nha Trang, Khánh Hòa',
    'văn hóa',
    ARRAY['Bình yên', 'Văn hóa', 'Hoang sơ'],
    50000,
    120,
    4.3,
    'Những chiếc thuyền gỗ màu xanh đỏ nằm san sát nhau, ngư dân vá lưới từ bình minh. Cuộc sống ở đây vẫn giữ nhịp điệu của hàng trăm năm trước — chậm rãi, thực chất, và đầy dư vị mặn mà của biển.',
    'https://picsum.photos/seed/vinhlуong/800/400',
    'Làng chài Vĩnh Lương là làng ngư nghiệp truyền thống phía bắc Nha Trang. Buổi sáng sớm (4-6h) thuyền về đầy cá, không khí tấp nập. Có thể mua hải sản tươi trực tiếp từ ngư dân.',
    true
  );
