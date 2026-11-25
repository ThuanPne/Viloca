-- Seed: 12 địa điểm check-in/sống ảo mới cho HN/DN/SG (đã loại "Chùa Linh Ứng
-- Bãi Bụt" và "Phố Tây Bùi Viện" khỏi danh sách đề xuất ban đầu vì không có
-- ảnh thật trong D:\Downloads\image\checkin — không thay thế bằng chỗ khác
-- theo yêu cầu). Ảnh đã upload thủ công lên bucket location-images (local).
--
-- google_maps_url để NULL — chưa có nguồn đủ tin cậy để xác nhận link chính
-- xác, cần bổ sung sau khi admin verify.

INSERT INTO locations (city, name, district, address, google_maps_url, category, style_tag, price_level, opening_hours, closing_hours, off_days, phone, short_description, long_description, cover_image, photos, verified, is_active)
VALUES
  (
    'HN', 'Phố Bích Họa Phùng Hưng', 'Hoàn Kiếm',
    'Phố Phùng Hưng, Hoàn Kiếm, Hà Nội',
    NULL,
    'Nghệ thuật, Check-in',
    'Bích họa, Nghệ thuật đường phố, Hoài cổ, Miễn phí',
    1, '00:00', '24:00', 'Không nghỉ', NULL,
    'Con phố tường gạch cổ dưới chân cầu đường sắt được vẽ bích họa tái hiện ký ức Hà Nội xưa.',
    'Dự án nghệ thuật cộng đồng biến những khung vòm gạch cũ dưới tuyến đường sắt trên phố Phùng Hưng thành triển lãm tranh bích họa ngoài trời, tái hiện các khung cảnh sinh hoạt Hà Nội xưa — chợ hoa, tàu điện, phố nghề. Là điểm chụp ảnh miễn phí được nhiều bạn trẻ và khách quốc tế ghé qua khi dạo phố cổ.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/pho-bich-hoa-phung-hung.jpg',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/pho-bich-hoa-phung-hung.jpg',
    true, true
  ),
  (
    'HN', 'Cà Phê Đường Tàu', 'Hoàn Kiếm',
    'Khu vực phố Trần Phú - Phùng Hưng - Điện Biên Phủ, Hoàn Kiếm, Hà Nội',
    NULL,
    'Trải nghiệm, Check-in',
    'Đường ray xe lửa, Độc đáo, Nhộn nhịp, Quốc tế',
    1, '07:00', '22:00', 'Không nghỉ', NULL,
    'Dãy quán cà phê sát đường ray xe lửa giữa lòng phố cổ, nổi tiếng với khách du lịch quốc tế.',
    'Phố Đường Tàu là dãy quán cà phê nhỏ nằm sát ngay đường ray xe lửa chạy xuyên qua khu phố cổ Hà Nội. Du khách vừa nhâm nhi cà phê vừa chờ đoàn tàu chạy ngang qua chỉ cách vài bước chân — trải nghiệm độc nhất vô nhị. Lưu ý tuân thủ hướng dẫn an toàn và lịch tàu chạy của địa phương.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/ca-phe-duong-tau.webp',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/ca-phe-duong-tau.webp',
    true, true
  ),
  (
    'HN', 'Vườn Hoa Bãi Đá Sông Hồng', 'Tây Hồ',
    '264 Âu Cơ, Tây Hồ, Hà Nội',
    NULL,
    'Thiên nhiên, Check-in',
    'Vườn hoa, Tiểu cảnh, Ven sông, Nhiều mùa hoa',
    1, '08:00', '18:00', 'Không nghỉ', NULL,
    'Không gian vườn hoa và tiểu cảnh rộng ven sông Hồng, thay đổi chủ đề hoa theo mùa.',
    'Bãi Đá Sông Hồng là khu vườn hoa tư nhân ven đê sông Hồng, được chia thành nhiều khu tiểu cảnh với các loài hoa thay đổi theo mùa (hướng dương, cúc họa mi, tam giác mạch...). Vé vào cửa tham khảo khoảng 50.000đ, phù hợp chụp ảnh gia đình, bộ ảnh cưới hoặc dạo chơi cuối tuần.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/vuon-hoa-bai-da-song-hong.jpg',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/vuon-hoa-bai-da-song-hong.jpg',
    true, true
  ),
  (
    'HN', 'Vườn Xương Rồng Cacti Zone', 'Đông Anh',
    'Thôn Ngọc Chi, Đông Anh, Hà Nội',
    NULL,
    'Trải nghiệm, Check-in',
    'Xương rồng, Sa mạc mini, Độc lạ',
    1, '08:00', '18:00', 'Không nghỉ', NULL,
    'Vườn xương rồng với hàng trăm loài tạo không gian như sa mạc thu nhỏ giữa lòng Hà Nội.',
    'Cacti Zone quy tụ hàng trăm loại xương rồng và cây mọng nước, được bài trí thành các góc tiểu cảnh phong cách sa mạc Mexico, rất được giới trẻ yêu thích để chụp ảnh. Vé tham khảo khoảng 80.000đ/người.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/vuon-xuong-rong-cacti-zone.jpg',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/vuon-xuong-rong-cacti-zone.jpg',
    true, true
  ),
  (
    'HN', 'Phim Trường Smiley Ville', 'Đông Anh',
    'Đông Anh, Hà Nội',
    NULL,
    'Trải nghiệm, Check-in',
    'Phim trường, Đa phong cách, Rộng lớn',
    2, '08:00', '18:00', 'Không nghỉ', NULL,
    'Phim trường ngoài trời rộng gần 5,5ha với hàng chục hậu cảnh đa phong cách để chụp ảnh.',
    'Smiley Ville là phim trường/khu check-in ngoại thành Hà Nội với diện tích gần 5,5ha, gồm nhiều cụm tiểu cảnh trong nhà và ngoài trời theo các chủ đề khác nhau (làng quê, châu Âu, cổ trang...). Phù hợp cho các buổi chụp ảnh nhóm, gia đình hoặc dã ngoại cuối tuần.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/phim-truong-smiley-ville.webp',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/phim-truong-smiley-ville.webp',
    true, true
  ),
  (
    'DN', 'Cầu Thuận Phước', 'Hải Châu',
    'Bắc qua sông Hàn, nối Hải Châu và Sơn Trà, Đà Nẵng',
    NULL,
    'Danh lam thắng cảnh, Check-in',
    'Cầu treo, Hoàng hôn, Biểu tượng Đà Nẵng',
    1, '00:00', '24:00', 'Không nghỉ', NULL,
    'Cầu treo dây võng dài nhất Việt Nam, điểm ngắm hoàng hôn đẹp trên sông Hàn.',
    'Cầu Thuận Phước là cây cầu treo dây võng dài nhất Việt Nam, nối liền trung tâm thành phố với bán đảo Sơn Trà. Khu vực chân cầu và lối đi bộ ven sông là nơi lý tưởng để ngắm hoàng hôn, đặc biệt đẹp vào khoảng 17h khi ánh nắng phản chiếu trên mặt nước sông Hàn.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/cau-thuan-phuoc.jpg',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/cau-thuan-phuoc.jpg',
    true, true
  ),
  (
    'DN', 'Nhà Thờ Con Gà (Nhà Thờ Chính Tòa Đà Nẵng)', 'Hải Châu',
    '156 Trần Phú, Hải Châu, Đà Nẵng',
    NULL,
    'Di tích tín ngưỡng, Check-in',
    'Kiến trúc Pháp, Gothic, Cổ kính',
    1, '05:00', '20:00', 'Không nghỉ', NULL,
    'Nhà thờ Chính Tòa Đà Nẵng mang kiến trúc Gothic Pháp, nổi bật với tượng gà trống trên nóc.',
    'Nhà Thờ Con Gà (Nhà Thờ Chính Tòa Đà Nẵng) được xây dựng từ thời Pháp thuộc, mang phong cách kiến trúc Gothic đặc trưng với tông màu hồng nhạt nổi bật. Tên gọi dân gian bắt nguồn từ tượng gà trống trên đỉnh tháp chuông — một trong những điểm check-in quen thuộc giữa trung tâm thành phố.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/nha-tho-con-ga.jpg',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/nha-tho-con-ga.jpg',
    true, true
  ),
  (
    'DN', 'Công Viên Châu Á (Asia Park)', 'Hải Châu',
    'Đường Phan Đăng Lưu, Hải Châu, Đà Nẵng',
    NULL,
    'Trải nghiệm, Check-in',
    'Công viên giải trí, Vòng quay Mặt Trời, Đa văn hóa châu Á',
    3, '15:00', '22:00', 'Không nghỉ', NULL,
    'Công viên giải trí mang kiến trúc các nước châu Á, nổi bật với vòng quay Sun Wheel.',
    'Asia Park (Công viên Châu Á) là khu vui chơi giải trí tái hiện kiến trúc và văn hóa đặc trưng của nhiều quốc gia châu Á, cùng các trò chơi cảm giác mạnh và vòng quay mặt trời Sun Wheel cao hơn 115m — nơi ngắm toàn cảnh Đà Nẵng về đêm.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/cong-vien-chau-a-asia-park.png',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/cong-vien-chau-a-asia-park.png',
    true, true
  ),
  (
    'SG', 'Phố Đi Bộ Nguyễn Huệ', 'Quận 1',
    'Đường Nguyễn Huệ, Bến Nghé, Quận 1, Hồ Chí Minh',
    NULL,
    'Trải nghiệm, Check-in',
    'Quảng trường, Về đêm, Nhộn nhịp, Trung tâm',
    1, '00:00', '24:00', 'Không nghỉ', NULL,
    'Quảng trường đi bộ trung tâm Sài Gòn, sôi động nhất về đêm với nhạc nước và nghệ sĩ đường phố.',
    'Phố đi bộ Nguyễn Huệ là trục quảng trường trung tâm Quận 1, trải dài từ UBND Thành phố đến bến Bạch Đằng. Về đêm, nơi đây thường có nhạc nước, nghệ sĩ đường phố biểu diễn và là điểm tổ chức các sự kiện lớn của thành phố — rất đông người dân và du khách tới dạo chơi, chụp ảnh.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/pho-di-bo-nguyen-hue.jpg',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/pho-di-bo-nguyen-hue.jpg',
    true, true
  ),
  (
    'SG', 'Nhà Thờ Đức Bà Sài Gòn', 'Quận 1',
    '01 Công xã Paris, Bến Nghé, Quận 1, Hồ Chí Minh',
    NULL,
    'Di tích tín ngưỡng, Check-in',
    'Kiến trúc Pháp, Gạch đỏ, Biểu tượng Sài Gòn',
    1, '08:00', '17:00', 'Không nghỉ', NULL,
    'Nhà thờ Công giáo mang kiến trúc Pháp cổ, biểu tượng kiến trúc nổi tiếng nhất Sài Gòn.',
    'Nhà Thờ Đức Bà Sài Gòn được xây dựng từ cuối thế kỷ 19 bằng gạch đỏ nhập từ Pháp, là một trong những công trình kiến trúc tôn giáo tiêu biểu và được chụp ảnh nhiều nhất tại trung tâm Quận 1. Khuôn viên phía trước với tượng Đức Mẹ Hòa Bình cũng là điểm check-in quen thuộc.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/nha-tho-duc-ba-sai-gon.jpg',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/nha-tho-duc-ba-sai-gon.jpg',
    true, true
  ),
  (
    'SG', 'Landmark 81 SkyView', 'Bình Thạnh',
    '720A Điện Biên Phủ, Phường 22, Bình Thạnh, Hồ Chí Minh',
    NULL,
    'Danh lam thắng cảnh, Check-in',
    'Tòa nhà cao nhất Việt Nam, Đài quan sát, View toàn cảnh',
    3, '09:00', '22:00', 'Không nghỉ', NULL,
    'Đài quan sát trên tòa nhà cao nhất Việt Nam, ngắm toàn cảnh Sài Gòn từ trên cao.',
    'Landmark 81 là tòa nhà cao nhất Việt Nam với 81 tầng. Đài quan sát Landmark 81 SkyView ở các tầng cao mang đến tầm nhìn 360 độ toàn cảnh thành phố, đặc biệt ấn tượng vào thời điểm hoàng hôn và khi lên đèn ban đêm.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/landmark-81-skyview.jpg',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/landmark-81-skyview.jpg',
    true, true
  ),
  (
    'SG', 'Chung Cư Cafe 42 Nguyễn Huệ', 'Quận 1',
    '42 Nguyễn Huệ, Bến Nghé, Quận 1, Hồ Chí Minh',
    NULL,
    'Café, Check-in',
    'Chung cư cũ, Hoài cổ, Concept store, Nhiều tầng quán',
    2, '07:00', '23:00', 'Không nghỉ', NULL,
    'Chung cư cũ giữa trung tâm được cải tạo thành cụm quán cà phê, concept store nhiều phong cách.',
    'Chung cư 42 Nguyễn Huệ là một trong những chung cư cũ nổi tiếng nhất Sài Gòn được các chủ quán trẻ cải tạo thành hàng chục quán cà phê, cửa hiệu nhỏ xinh trải dài qua nhiều tầng lầu. Mỗi tầng, mỗi quán mang một phong cách trang trí riêng, là điểm check-in quen thuộc của giới trẻ Sài Gòn.',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/chung-cu-cafe-42-nguyen-hue.jpg',
    'http://127.0.0.1:55321/storage/v1/object/public/location-images/chung-cu-cafe-42-nguyen-hue.jpg',
    true, true
  );
