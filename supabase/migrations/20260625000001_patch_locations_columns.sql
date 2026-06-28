-- Patch locations table: add AI-required columns if they don't exist
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS price_per_person  INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_minutes  INTEGER     NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS rating            NUMERIC(2,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hint              TEXT,
  ADD COLUMN IF NOT EXISTS cover_image       TEXT;

-- Ensure vibes GIN index exists (vibes column already added by previous patch)
CREATE INDEX IF NOT EXISTS idx_locations_vibes ON public.locations USING GIN (vibes);
