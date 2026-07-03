-- Festivals: annual seasonal events (lễ hội bánh mì, lễ hội Kate, etc.)
CREATE TABLE festivals (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT    NOT NULL,
  location     TEXT    NOT NULL,
  cover_image  TEXT,
  month        INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  start_date   DATE    DEFAULT NULL,
  end_date     DATE    DEFAULT NULL,
  description  TEXT,
  tags         TEXT[]  DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_festivals_month ON festivals (month);

ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_festivals"
  ON festivals FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_write_festivals"
  ON festivals FOR ALL TO service_role USING (true) WITH CHECK (true);
