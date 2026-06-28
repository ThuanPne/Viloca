# Hướng dẫn triển khai: Guide Tours (Production)

File này hướng dẫn tạo toàn bộ schema cho tính năng HDV (Hướng dẫn viên) trên Supabase production.
Chạy từng block SQL theo thứ tự trong **Supabase Studio → SQL Editor** hoặc qua `npx supabase db push`.

---

## 1. guide_profiles — Hồ sơ HDV

```sql
CREATE TABLE public.guide_profiles (
  id              UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio             TEXT,
  languages       TEXT[]      NOT NULL DEFAULT '{}',
  specialties     TEXT[]      NOT NULL DEFAULT '{}',
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews   INT          NOT NULL DEFAULT 0,
  total_tours     INT          NOT NULL DEFAULT 0,
  verified        BOOLEAN      NOT NULL DEFAULT false,
  cover_image     TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_profiles ENABLE ROW LEVEL SECURITY;

-- Mọi người xem, chủ sở hữu cập nhật
CREATE POLICY "guide_profiles_select_all"
  ON public.guide_profiles FOR SELECT USING (true);

CREATE POLICY "guide_profiles_insert_own"
  ON public.guide_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "guide_profiles_update_own"
  ON public.guide_profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## 2. guide_tours — Tour HDV tạo

```sql
CREATE TABLE public.guide_tours (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id         UUID        NOT NULL REFERENCES public.guide_profiles(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT,
  destination      TEXT        NOT NULL,
  meeting_point    TEXT,
  cover_image      TEXT,
  category         TEXT,
  languages        TEXT[]      NOT NULL DEFAULT '{}',
  max_group_size   INT         NOT NULL DEFAULT 10,
  price_per_person NUMERIC(12,0) NOT NULL DEFAULT 0,
  platform_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 30,
  duration_hours   NUMERIC(4,1),
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'active', 'paused')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guide_tours_select_active"
  ON public.guide_tours FOR SELECT
  USING (status = 'active' OR guide_id = auth.uid());

CREATE POLICY "guide_tours_insert_own"
  ON public.guide_tours FOR INSERT
  WITH CHECK (guide_id = auth.uid());

CREATE POLICY "guide_tours_update_own"
  ON public.guide_tours FOR UPDATE
  USING (guide_id = auth.uid());

CREATE POLICY "guide_tours_delete_own"
  ON public.guide_tours FOR DELETE
  USING (guide_id = auth.uid());

CREATE INDEX idx_guide_tours_guide_id ON public.guide_tours (guide_id);
CREATE INDEX idx_guide_tours_destination ON public.guide_tours (destination);
```

---

## 3. tour_stops — Lịch trình chi tiết

```sql
CREATE TABLE public.tour_stops (
  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id                  UUID    NOT NULL REFERENCES public.guide_tours(id) ON DELETE CASCADE,
  location_id              UUID    REFERENCES public.locations(id) ON DELETE SET NULL,
  name                     TEXT    NOT NULL,
  category                 TEXT,
  visit_time               TIME,
  duration_minutes         INT,
  travel_to_next_minutes   INT,
  travel_mode              TEXT    CHECK (travel_mode IN ('drive', 'walk', 'boat')),
  sort_order               INT     NOT NULL DEFAULT 0
);

ALTER TABLE public.tour_stops ENABLE ROW LEVEL SECURITY;

-- Mọi người xem (để tourist preview tour)
CREATE POLICY "tour_stops_select_all"
  ON public.tour_stops FOR SELECT USING (true);

CREATE POLICY "tour_stops_manage_guide"
  ON public.tour_stops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.guide_tours gt
      WHERE gt.id = tour_id AND gt.guide_id = auth.uid()
    )
  );

CREATE INDEX idx_tour_stops_tour_id ON public.tour_stops (tour_id, sort_order);
```

---

## 4. tour_bookings — Khách đặt tour

```sql
CREATE TABLE public.tour_bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id          UUID        NOT NULL REFERENCES public.guide_tours(id),
  guide_id         UUID        NOT NULL REFERENCES public.guide_profiles(id),
  customer_id      UUID        NOT NULL REFERENCES public.profiles(id),
  booking_code     TEXT        UNIQUE NOT NULL
                               DEFAULT 'VL-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0'),
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  booking_date     DATE        NOT NULL,
  start_time       TIME        NOT NULL,
  guest_count      INT         NOT NULL DEFAULT 1,
  language         TEXT,
  special_requests TEXT[],
  tour_price       NUMERIC(12,0),
  guide_earning    NUMERIC(12,0),
  platform_fee     NUMERIC(12,0),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

-- HDV xem booking của mình; customer xem booking của họ
CREATE POLICY "tour_bookings_guide_access"
  ON public.tour_bookings FOR SELECT
  USING (guide_id = auth.uid() OR customer_id = auth.uid());

CREATE POLICY "tour_bookings_customer_insert"
  ON public.tour_bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Chỉ HDV cập nhật status (confirmed, active, completed)
CREATE POLICY "tour_bookings_guide_update"
  ON public.tour_bookings FOR UPDATE
  USING (guide_id = auth.uid());

CREATE INDEX idx_tour_bookings_guide_id     ON public.tour_bookings (guide_id, status);
CREATE INDEX idx_tour_bookings_customer_id  ON public.tour_bookings (customer_id);
CREATE INDEX idx_tour_bookings_booking_date ON public.tour_bookings (booking_date);
```

---

## 5. tour_reviews — Đánh giá sau tour

```sql
CREATE TABLE public.tour_reviews (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID    NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  reviewer_id UUID    NOT NULL REFERENCES public.profiles(id),
  guide_id    UUID    NOT NULL REFERENCES public.guide_profiles(id),
  rating      INT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reviewer_id)
);

ALTER TABLE public.tour_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tour_reviews_select_all"
  ON public.tour_reviews FOR SELECT USING (true);

CREATE POLICY "tour_reviews_insert_customer"
  ON public.tour_reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tour_bookings b
      WHERE b.id = booking_id
        AND b.customer_id = auth.uid()
        AND b.status = 'completed'
    )
  );

CREATE INDEX idx_tour_reviews_guide_id ON public.tour_reviews (guide_id);
```

---

## 6. Trigger: tự động cập nhật rating HDV

```sql
CREATE OR REPLACE FUNCTION public.update_guide_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.guide_profiles
  SET
    rating        = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.tour_reviews
      WHERE guide_id = NEW.guide_id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM public.tour_reviews WHERE guide_id = NEW.guide_id
    ),
    updated_at    = now()
  WHERE id = NEW.guide_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_guide_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.tour_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_guide_rating();
```

---

## 7. Trigger: cập nhật total_tours khi booking completed

```sql
CREATE OR REPLACE FUNCTION public.update_guide_total_tours()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.guide_profiles
    SET total_tours = total_tours + 1, updated_at = now()
    WHERE id = NEW.guide_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_guide_total_tours
  AFTER UPDATE ON public.tour_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_guide_total_tours();
```

---

## 8. Trigger: tính guide_earning tự động từ tour_price

```sql
CREATE OR REPLACE FUNCTION public.calc_booking_earnings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  fee_pct NUMERIC;
BEGIN
  SELECT platform_fee_pct INTO fee_pct
  FROM public.guide_tours WHERE id = NEW.tour_id;

  NEW.platform_fee  := ROUND(NEW.tour_price * fee_pct / 100);
  NEW.guide_earning := NEW.tour_price - NEW.platform_fee;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calc_booking_earnings
  BEFORE INSERT OR UPDATE OF tour_price ON public.tour_bookings
  FOR EACH ROW EXECUTE FUNCTION public.calc_booking_earnings();
```

---

## 9. Tạo guide_profile khi user đăng ký làm HDV

Gọi từ client (hoặc Edge Function) sau khi user toggle role = 'guide':

```sql
INSERT INTO public.guide_profiles (id)
VALUES (auth.uid())
ON CONFLICT (id) DO NOTHING;
```

---

## Thứ tự chạy

1. Block 1 – `guide_profiles`
2. Block 2 – `guide_tours`
3. Block 3 – `tour_stops`
4. Block 4 – `tour_bookings`
5. Block 5 – `tour_reviews`
6. Block 6 – Trigger rating
7. Block 7 – Trigger total_tours
8. Block 8 – Trigger earnings
9. Block 9 – Seed guide profile (khi cần test)

Sau khi chạy, kiểm tra:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('guide_profiles','guide_tours','tour_stops','tour_bookings','tour_reviews');
-- Phải trả về 5 rows

SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('trg_guide_rating_on_review','trg_guide_total_tours','trg_calc_booking_earnings');
-- Phải trả về 3 rows
```
