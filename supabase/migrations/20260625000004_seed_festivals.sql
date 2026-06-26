-- Seed festivals with varied months to test display logic
INSERT INTO festivals (name, location, cover_image, month, start_date, end_date, description, tags) VALUES
(
  'Lễ hội Bánh Mì',
  'Hội An, Quảng Nam',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
  3,
  '2026-03-15',
  '2026-03-17',
  'Lễ hội tôn vinh chiếc bánh mì Việt Nam với hàng trăm gian hàng và cuộc thi sáng tạo.',
  ARRAY['ẩm thực', 'văn hóa', 'hội an']
),
(
  'Festival Đèn Lồng Hội An',
  'Phố cổ Hội An',
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
  8,
  NULL,
  NULL,
  'Đêm phố cổ không điện, ánh đèn lồng lung linh phản chiếu xuống sông Hoài.',
  ARRAY['văn hóa', 'checkin', 'hội an', 'đêm']
),
(
  'Lễ hội Kate',
  'Ninh Thuận',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
  10,
  '2026-10-02',
  '2026-10-04',
  'Lễ hội lớn nhất của người Chăm Pa, tưởng nhớ các vị thần và tổ tiên.',
  ARRAY['văn hóa', 'dân tộc', 'chăm', 'ninh thuận']
),
(
  'Lễ hội Hoa Đà Lạt',
  'Đà Lạt, Lâm Đồng',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  12,
  NULL,
  NULL,
  'Lễ hội hoa thường niên tại thành phố ngàn hoa với các triển lãm hoa nghệ thuật.',
  ARRAY['thiên nhiên', 'checkin', 'đà lạt', 'hoa']
),
(
  'Tết Nguyên Đán',
  'Toàn quốc',
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
  1,
  '2027-01-29',
  '2027-02-04',
  'Lễ tết truyền thống lớn nhất Việt Nam với pháo hoa, mai đào và gia đình sum họp.',
  ARRAY['văn hóa', 'truyền thống', 'tết']
);
