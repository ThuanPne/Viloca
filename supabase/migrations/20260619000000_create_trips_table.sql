-- Trips table
create table if not exists public.trips (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  destination   text not null,
  start_date    date,
  end_date      date,
  cover_image   text,
  status        text not null default 'planning' check (status in ('planning','active','completed')),
  summary_note  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Trip items (experiences per day)
create table if not exists public.trip_items (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  experience_id uuid,
  day_number    int not null default 1,
  time_slot     text not null default 'morning' check (time_slot in ('morning','afternoon','evening')),
  note          text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- Trip journals (daily notes)
create table if not exists public.trip_journals (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  day_number    int not null default 1,
  content       text not null default '',
  photos        text[] not null default '{}',
  mood          text check (mood in ('great','good','okay','tired')),
  weather       text check (weather in ('sunny','rainy','cloudy')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(trip_id, day_number)
);

-- RLS
alter table public.trips         enable row level security;
alter table public.trip_items    enable row level security;
alter table public.trip_journals enable row level security;

-- Trips policies
create policy "Users can view own trips"
  on public.trips for select
  using (auth.uid() = user_id);

create policy "Users can insert own trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trips"
  on public.trips for update
  using (auth.uid() = user_id);

create policy "Users can delete own trips"
  on public.trips for delete
  using (auth.uid() = user_id);

-- Trip items policies
create policy "Users can manage own trip items"
  on public.trip_items for all
  using (exists (select 1 from public.trips where id = trip_id and user_id = auth.uid()));

-- Trip journals policies
create policy "Users can manage own journals"
  on public.trip_journals for all
  using (exists (select 1 from public.trips where id = trip_id and user_id = auth.uid()));

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.handle_updated_at();

create trigger journals_updated_at
  before update on public.trip_journals
  for each row execute function public.handle_updated_at();
