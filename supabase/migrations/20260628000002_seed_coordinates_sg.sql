-- Seed coordinates for Saigon (SG) locations
UPDATE locations SET coordinates = '{"lat": 10.7769, "lng": 106.6956}'::jsonb WHERE city = 'SG' AND name = 'Dinh Độc Lập';
UPDATE locations SET coordinates = '{"lat": 10.7800, "lng": 106.6991}'::jsonb WHERE city = 'SG' AND name = 'Bưu Điện Trung Tâm Sài Gòn';
UPDATE locations SET coordinates = '{"lat": 10.7763, "lng": 106.7031}'::jsonb WHERE city = 'SG' AND name = 'Nhà Hát Thành Phố Hồ Chí Minh';
UPDATE locations SET coordinates = '{"lat": 10.7879, "lng": 106.7036}'::jsonb WHERE city = 'SG' AND name = 'Bảo Tàng Lịch Sử TP. Hồ Chí Minh';
UPDATE locations SET coordinates = '{"lat": 10.7727, "lng": 106.6980}'::jsonb WHERE city = 'SG' AND name = 'Chợ Bến Thành';
UPDATE locations SET coordinates = '{"lat": 10.7791, "lng": 106.6926}'::jsonb WHERE city = 'SG' AND name = 'Bảo Tàng Chứng Tích Chiến Tranh';
