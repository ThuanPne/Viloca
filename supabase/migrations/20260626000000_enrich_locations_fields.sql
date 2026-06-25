-- Phase 1a: Enrich locations with vibes, price, duration, rating, cover_image, description
-- Run in Supabase SQL editor or via `npx supabase db push`

-- 1. Copy short_description → description (source for AI hint generation)
UPDATE public.locations
  SET description = short_description
  WHERE description IS NULL AND short_description IS NOT NULL;

-- 2. Assign vibes by category (must match VIBES options in workspace.tsx)
UPDATE public.locations SET vibes = ARRAY['Cổ kính','Văn hóa','Bình yên']
  WHERE category IN ('Di tích lịch sử','Bảo tàng','Làng nghề')
    AND (vibes IS NULL OR array_length(vibes, 1) IS NULL OR array_length(vibes, 1) = 0);

UPDATE public.locations SET vibes = ARRAY['Bình yên','Cổ kính']
  WHERE category = 'Di tích tín ngưỡng'
    AND (vibes IS NULL OR array_length(vibes, 1) IS NULL OR array_length(vibes, 1) = 0);

UPDATE public.locations SET vibes = ARRAY['Hoang sơ','Bình yên']
  WHERE category IN ('Thiên nhiên','Danh lam thắng cảnh','Du lịch sinh thái')
    AND (vibes IS NULL OR array_length(vibes, 1) IS NULL OR array_length(vibes, 1) = 0);

UPDATE public.locations SET vibes = ARRAY['Mạo hiểm','Văn hóa']
  WHERE category IN ('Trải nghiệm','Du lịch cộng đồng')
    AND (vibes IS NULL OR array_length(vibes, 1) IS NULL OR array_length(vibes, 1) = 0);

UPDATE public.locations SET vibes = ARRAY['Văn hóa']
  WHERE category IN ('Nghệ thuật','Văn hóa')
    AND (vibes IS NULL OR array_length(vibes, 1) IS NULL OR array_length(vibes, 1) = 0);

UPDATE public.locations SET vibes = ARRAY['Ẩm thực','Bình yên']
  WHERE category IN ('Ẩm thực','Café')
    AND (vibes IS NULL OR array_length(vibes, 1) IS NULL OR array_length(vibes, 1) = 0);

UPDATE public.locations SET vibes = ARRAY['Bình yên']
  WHERE category = 'Lưu trú'
    AND (vibes IS NULL OR array_length(vibes, 1) IS NULL OR array_length(vibes, 1) = 0);

-- 3. Price per person (VND) by category — only where still 0
UPDATE public.locations SET price_per_person = 30000
  WHERE category IN ('Di tích lịch sử','Di tích tín ngưỡng') AND price_per_person = 0;

UPDATE public.locations SET price_per_person = 50000
  WHERE category IN ('Bảo tàng','Văn hóa','Nghệ thuật','Thiên nhiên','Danh lam thắng cảnh','Du lịch sinh thái')
    AND price_per_person = 0;

UPDATE public.locations SET price_per_person = 80000
  WHERE category IN ('Ẩm thực','Café') AND price_per_person = 0;

UPDATE public.locations SET price_per_person = 150000
  WHERE category IN ('Trải nghiệm','Du lịch cộng đồng','Làng nghề') AND price_per_person = 0;

-- 4. Duration (minutes) by category — only where still at default 120
UPDATE public.locations SET duration_minutes = 90
  WHERE category IN ('Di tích lịch sử','Bảo tàng','Văn hóa','Nghệ thuật','Di tích tín ngưỡng')
    AND duration_minutes = 120;

UPDATE public.locations SET duration_minutes = 60
  WHERE category IN ('Ẩm thực','Café') AND duration_minutes = 120;

UPDATE public.locations SET duration_minutes = 150
  WHERE category IN ('Thiên nhiên','Danh lam thắng cảnh','Du lịch sinh thái','Trải nghiệm')
    AND duration_minutes = 120;

-- 5. Default rating 4.0 for any without rating
UPDATE public.locations SET rating = 4.0 WHERE rating IS NULL;

-- 6. Deterministic cover image via picsum (no API key needed)
UPDATE public.locations
  SET cover_image = 'https://picsum.photos/seed/loc-' || id::text || '/800/600'
  WHERE cover_image IS NULL;
