-- Locations pool: cultural/local travel spots
CREATE TABLE locations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Free tier fields (visible to all authenticated users)
  hint              TEXT,                          -- AI-generated curiosity hint (no name/address)
  cover_image       TEXT,                          -- main display image URL
  images            TEXT[]          DEFAULT '{}',  -- gallery images
  category          TEXT            NOT NULL,      -- e.g. 'ẩm thực', 'di tích', 'thiên nhiên'
  vibes             TEXT[]          DEFAULT '{}',  -- e.g. ['bình yên', 'cổ kính', 'hoang sơ']
  price_per_person  INTEGER         NOT NULL DEFAULT 0,  -- VND
  duration_minutes  INTEGER         NOT NULL DEFAULT 120,
  rating            NUMERIC(2,1)    DEFAULT NULL,

  -- Premium fields (only unlocked per-trip)
  name              TEXT            NOT NULL,
  address           TEXT,
  coordinates       JSONB,          -- { lat: number, lng: number }

  -- Admin / internal fields
  description       TEXT,           -- source text fed to AI for hint generation
  is_active         BOOLEAN         NOT NULL DEFAULT true,
  hint_generated_at TIMESTAMPTZ     DEFAULT NULL,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Public read-only view: strips premium + admin fields
CREATE VIEW locations_preview AS
  SELECT
    id,
    hint,
    cover_image,
    images,
    category,
    vibes,
    price_per_person,
    duration_minutes,
    rating
  FROM locations
  WHERE is_active = true;

-- RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active locations (premium fields included — filtered at app layer or via view)
CREATE POLICY "authenticated_read_locations"
  ON locations FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only service role can insert/update/delete (admin operations via Edge Functions)
CREATE POLICY "service_role_write_locations"
  ON locations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for common filters
CREATE INDEX idx_locations_category  ON locations (category);
CREATE INDEX idx_locations_is_active ON locations (is_active);
CREATE INDEX idx_locations_vibes     ON locations USING GIN (vibes);
