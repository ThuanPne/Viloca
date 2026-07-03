create table public.packing_items (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid references public.trips(id) on delete cascade not null,
  name       text not null,
  is_packed  boolean default false,
  category   text default 'other',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.packing_items enable row level security;

create policy "Users manage packing via trip ownership"
  on public.packing_items for all
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  );
