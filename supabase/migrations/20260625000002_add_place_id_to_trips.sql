-- Add place_id FK to trips (nullable for backward compat with destination text)
ALTER TABLE trips
  ADD COLUMN place_id UUID REFERENCES places(id) ON DELETE SET NULL;

CREATE INDEX idx_trips_place_id_status ON trips (place_id, status)
  WHERE place_id IS NOT NULL;
