-- Migrate locations table from hint-based schema to full location schema
-- Drop dependent view first
DROP VIEW IF EXISTS locations_preview;

-- Drop old indexes
DROP INDEX IF EXISTS idx_locations_category;
DROP INDEX IF EXISTS idx_locations_is_active;
DROP INDEX IF EXISTS idx_locations_vibes;

-- Drop old columns that don't fit new schema
ALTER TABLE locations
  DROP COLUMN IF EXISTS hint,
  DROP COLUMN IF EXISTS cover_image,
  DROP COLUMN IF EXISTS images,
  DROP COLUMN IF EXISTS vibes,
  DROP COLUMN IF EXISTS price_per_person,
  DROP COLUMN IF EXISTS duration_minutes,
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS coordinates,
  DROP COLUMN IF EXISTS hint_generated_at;

-- Rename description → long_description
ALTER TABLE locations RENAME COLUMN description TO long_description;

-- Relax NOT NULL on category (some entries may lack it)
ALTER TABLE locations ALTER COLUMN category DROP NOT NULL;

-- Add new columns
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS city              TEXT,
  ADD COLUMN IF NOT EXISTS district         TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url  TEXT,
  ADD COLUMN IF NOT EXISTS style_tag        TEXT,
  ADD COLUMN IF NOT EXISTS price_level      INTEGER CHECK (price_level BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS opening_hours    TEXT,
  ADD COLUMN IF NOT EXISTS closing_hours    TEXT,
  ADD COLUMN IF NOT EXISTS off_days         TEXT,
  ADD COLUMN IF NOT EXISTS phone            TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS photos           TEXT,
  ADD COLUMN IF NOT EXISTS verified         BOOLEAN NOT NULL DEFAULT false;

-- New indexes
CREATE INDEX idx_locations_city     ON locations (city);
CREATE INDEX idx_locations_category ON locations (category);
CREATE INDEX idx_locations_price    ON locations (price_level);
CREATE INDEX idx_locations_verified ON locations (verified);
CREATE INDEX idx_locations_active   ON locations (is_active);
