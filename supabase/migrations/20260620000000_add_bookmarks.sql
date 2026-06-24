create table public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  experience_id text not null,
  status        text check (status in ('want', 'planned', 'done')) default 'want',
  created_at    timestamptz default now(),
  unique(user_id, experience_id)
);

alter table public.bookmarks enable row level security;

create policy "Users manage own bookmarks"
  on public.bookmarks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
