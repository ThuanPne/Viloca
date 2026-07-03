alter table public.profiles add column if not exists age_range text;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, age_range)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'age_range'
  );
  return new;
end;
$$ language plpgsql security definer;
