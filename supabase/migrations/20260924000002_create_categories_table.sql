CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL      PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  emoji      TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0
);

INSERT INTO categories (name, emoji, sort_order) VALUES
  ('Ẩm thực',             '🍜', 1),
  ('Café',                '☕', 2),
  ('Di tích lịch sử',     '🏛️', 3),
  ('Bảo tàng',            '🖼️', 4),
  ('Di tích tín ngưỡng',  '🕌', 5),
  ('Văn hóa',             '🎭', 6),
  ('Nghệ thuật',          '🎨', 7),
  ('Thiên nhiên',         '🌿', 8),
  ('Danh lam thắng cảnh', '⛰️', 9),
  ('Du lịch sinh thái',   '🌱', 10),
  ('Du lịch cộng đồng',   '🤝', 11),
  ('Làng nghề',           '🏺', 12),
  ('Trải nghiệm',         '🎒', 13),
  ('Lưu trú',             '🏡', 14)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_categories"
  ON categories FOR SELECT
  USING (true);
