-- Places: city/destination-level entities (Hội An, Đà Lạt, etc.)
CREATE TYPE place_region AS ENUM ('north', 'central', 'south');

CREATE TABLE places (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  slug              TEXT        NOT NULL UNIQUE,
  region            place_region NOT NULL,
  cover_image       TEXT,
  description       TEXT,
  experience_types  TEXT[]      DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_places_region ON places (region);
CREATE INDEX idx_places_slug   ON places (slug);

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_places"
  ON places FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_write_places"
  ON places FOR ALL TO service_role USING (true) WITH CHECK (true);
