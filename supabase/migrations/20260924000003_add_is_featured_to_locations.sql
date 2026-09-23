ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_locations_featured
  ON locations (is_featured)
  WHERE is_featured = true;
