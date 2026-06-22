-- Add INSERT policy so users can create their own profile row directly if needed
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Upsert on conflict: if user retries registration after email-send failure,
-- the trigger won't crash on duplicate id — it updates instead.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, age_range)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'age_range'
  )
  on conflict (id) do update
    set
      full_name  = excluded.full_name,
      age_range  = excluded.age_range,
      updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Auto-update updated_at on every profile update
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
