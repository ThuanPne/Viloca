-- Normalize locations.category to 14 clean Vietnamese categories:
-- Ẩm thực | Bảo tàng | Café | Danh lam thắng cảnh | Di tích lịch sử
-- Di tích tín ngưỡng | Du lịch cộng đồng | Du lịch sinh thái | Làng nghề
-- Lưu trú | Nghệ thuật | Thiên nhiên | Trải nghiệm | Văn hóa

-- Fix lowercase inconsistencies
UPDATE locations SET category = 'Ẩm thực'        WHERE category = 'ẩm thực';
UPDATE locations SET category = 'Thiên nhiên'     WHERE category = 'thiên nhiên';
UPDATE locations SET category = 'Văn hóa'         WHERE category = 'văn hóa';
UPDATE locations SET category = 'Di tích lịch sử' WHERE category = 'di tích';

-- Ẩm thực
UPDATE locations SET category = 'Ẩm thực' WHERE category IN (
  'Ẩm thực, Café',
  'Ẩm thực, Mua sắm, Văn hóa',
  'Ẩm thực, Về đêm'
);

-- Bảo tàng
UPDATE locations SET category = 'Bảo tàng' WHERE category IN (
  'Bảo tàng, Lịch sử',
  'Bảo tàng, Nghệ thuật',
  'Bảo tàng, Văn hóa'
);

-- Café
UPDATE locations SET category = 'Café' WHERE category IN (
  'Café, Check-in',
  'Café, Trải nghiệm',
  'Check-in, Workshop, Café'
);

-- Danh lam thắng cảnh
UPDATE locations SET category = 'Danh lam thắng cảnh' WHERE category IN (
  'Danh lam thắng cảnh, Di tích',
  'Danh lam thắng cảnh, Trải nghiệm'
);

-- Di tích lịch sử
UPDATE locations SET category = 'Di tích lịch sử' WHERE category IN (
  'Di tích lịch sử, Bảo tàng',
  'Di tích lịch sử, Khảo cổ',
  'Di tích lịch sử, Kiến trúc',
  'Di tích lịch sử, Trang nghiêm',
  'Di tích lịch sử, Vườn',
  'Di tích, Di sản UNESCO',
  'Di tích, Kiến trúc cổ',
  'Di tích, Trải nghiệm',
  'Tham quan, Lịch sử',
  'Trải nghiệm, Di tích lịch sử',
  'Trải nghiệm, Kiến trúc cổ',
  'Trải nghiệm, Lịch sử'
);

-- Di tích tín ngưỡng
UPDATE locations SET category = 'Di tích tín ngưỡng' WHERE category IN (
  'Di tích tín ngưỡng, Kiến trúc',
  'Di tích tín ngưỡng, Nghệ thuật',
  'Di tích tín ngưỡng, Thiên nhiên',
  'Kiến trúc, Tôn giáo'
);

-- Du lịch cộng đồng
UPDATE locations SET category = 'Du lịch cộng đồng' WHERE category IN (
  'Du lịch cộng đồng, Lưu trú, Trekking',
  'Lưu trú, Du lịch cộng đồng',
  'Trải nghiệm, Du lịch cộng đồng'
);

-- Du lịch sinh thái
UPDATE locations SET category = 'Du lịch sinh thái' WHERE category IN (
  'Du lịch sinh thái, Trải nghiệm',
  'Trải nghiệm, Du lịch sinh thái'
);

-- Làng nghề
UPDATE locations SET category = 'Làng nghề' WHERE category IN (
  'Làng nghề, Di tích',
  'Trải nghiệm, Làng nghề'
);

-- Lưu trú
UPDATE locations SET category = 'Lưu trú' WHERE category = 'Lưu trú, Nghỉ dưỡng';

-- Nghệ thuật
UPDATE locations SET category = 'Nghệ thuật' WHERE category IN (
  'Kiến trúc, Văn hóa, Nghệ thuật',
  'Nghệ thuật biểu diễn, Trải nghiệm',
  'Nghệ thuật dân gian, Biểu diễn',
  'Tham quan, Nghệ thuật',
  'Trải nghiệm, Nghệ thuật'
);

-- Thiên nhiên
UPDATE locations SET category = 'Thiên nhiên' WHERE category IN (
  'Thiên nhiên, Trải nghiệm',
  'Trải nghiệm, Nghỉ dưỡng'
);

-- Trải nghiệm
UPDATE locations SET category = 'Trải nghiệm' WHERE category IN (
  'Tham quan, Trải nghiệm',
  'Trải nghiệm địa phương, Về đêm',
  'Trải nghiệm, Check-in, Giải trí',
  'Trải nghiệm, Về đêm',
  'Trải nghiệm, Workshop'
);

-- Văn hóa
UPDATE locations SET category = 'Văn hóa' WHERE category IN (
  'Chợ truyền thống, Về đêm',
  'Chợ truyền thống, Văn hóa',
  'Trải nghiệm, Văn hóa'
);
