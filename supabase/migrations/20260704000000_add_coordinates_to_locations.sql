-- Re-add lat/lng columns to locations (previously stored as coordinates JSONB, then dropped)
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Spatial index for proximity queries
CREATE INDEX IF NOT EXISTS idx_locations_lat_lng
  ON locations (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- RPC: find locations within radius_km of a point using Haversine formula
-- Called from the background dwell-detection task
CREATE OR REPLACE FUNCTION nearby_locations(
  user_lat   DOUBLE PRECISION,
  user_lng   DOUBLE PRECISION,
  radius_km  DOUBLE PRECISION DEFAULT 0.5,
  excluded_ids UUID[] DEFAULT '{}'
)
RETURNS SETOF locations
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM locations
  WHERE is_active = true
    AND lat IS NOT NULL
    AND lng IS NOT NULL
    AND id != ALL(excluded_ids)
    AND (
      6371 * acos(
        LEAST(1.0,
          cos(radians(user_lat)) * cos(radians(lat))
          * cos(radians(lng) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(lat))
        )
      )
    ) <= radius_km
  ORDER BY (
    6371 * acos(
      LEAST(1.0,
        cos(radians(user_lat)) * cos(radians(lat))
        * cos(radians(lng) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(lat))
      )
    )
  ) ASC
  LIMIT 5;
$$;

-- Allow authenticated users to call this RPC
GRANT EXECUTE ON FUNCTION nearby_locations TO authenticated;
