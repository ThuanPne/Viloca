-- Allow anyone (including unauthenticated) to read locations
alter table locations enable row level security;

create policy "public_read_locations"
  on locations for select
  using (true);
