-- Re-add coordinates column (was dropped in alter_locations_table migration)
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS coordinates JSONB;

COMMENT ON COLUMN locations.coordinates IS '{ "lat": number, "lng": number } — WGS84 decimal degrees';
