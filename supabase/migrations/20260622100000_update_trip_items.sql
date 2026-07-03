-- Link trip_items to the locations pool
ALTER TABLE trip_items
  ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX idx_trip_items_location_id ON trip_items (location_id);
