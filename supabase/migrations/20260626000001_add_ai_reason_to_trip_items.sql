-- Phase 2a: Add ai_reason column to trip_items for storing AI explanation per slot
ALTER TABLE public.trip_items ADD COLUMN IF NOT EXISTS ai_reason TEXT;
