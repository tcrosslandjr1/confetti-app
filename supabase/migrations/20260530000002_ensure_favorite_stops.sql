-- Ensures favorite_stops exists — prior migration was recorded but table absent.

create table if not exists public.favorite_stops (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  venue_name   text not null,
  vibe         text,
  tone         text,
  address      text,
  neighborhood text,
  notes        text,
  created_at   timestamptz not null default now(),
  unique (user_id, venue_name)
);

alter table public.favorite_stops enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'favorite_stops' and policyname = 'own favorites all'
  ) then
    create policy "own favorites all" on public.favorite_stops
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_favorite_stops_user
  on public.favorite_stops (user_id, created_at desc);
