-- Gắn thêm tag "Check-in" cho các địa điểm đã tồn tại trong DB mà thực tế
-- là điểm check-in/sống ảo nổi tiếng, thay vì tạo bản ghi mới trùng lặp.
-- (Ba Na Hills, Làng Nghề Tăm Hương Quảng Phú Cầu, Bảo Tàng Gốm Bát Tràng
--  đã có sẵn "Check-in" trong category từ trước nên không cần động tới.)

UPDATE public.locations
SET category = category || ', Check-in'
WHERE category NOT ILIKE '%Check-in%'
  AND (
    -- Hà Nội
    name = 'Cầu Long Biên'
    OR name = 'Dự Án Nghệ Thuật Công Cộng Phúc Tân'
    OR name = 'Ô Quan Chưởng'
    OR name = 'Văn Miếu - Quốc Tử Giám'
    OR name = 'Phố Đi Bộ Hồ Hoàn Kiếm'
    OR name = 'Hồ Hoàn Kiếm (Hồ Gươm)'
    OR name = 'Đền Ngọc Sơn & Cầu Thê Húc'
    OR name = 'Nhà Thờ Lớn Hà Nội'
    OR name = 'Nhà Hát Lớn Hà Nội'
    OR name = 'Chùa Một Cột'
    OR name = 'Chùa Trấn Quốc'
    OR name = 'Hồ Tây (Đường Thanh Niên)'
    OR name = 'Phố Bia Hơi Tạ Hiện'
    -- Đà Nẵng
    OR name = 'Rừng Dừa Bảy Mẫu'
    OR name = 'Nhà Cổ Tân Kỳ'
    OR name = 'Hội Quán Phước Kiến'
    OR name = 'Công Viên Đất Nung Thanh Hà'
    -- TP. Hồ Chí Minh
    OR name = 'Dinh Độc Lập'
    OR name = 'Bưu Điện Trung Tâm Sài Gòn'
    OR name = 'Nhà Hát Thành Phố Hồ Chí Minh'
    OR name = 'Chợ Bến Thành'
  );
