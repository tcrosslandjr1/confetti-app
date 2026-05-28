-- City waitlist table for DMV-first launch gate.
-- Already applied to production — this file exists for repo completeness.

create table if not exists public.city_waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  voted_city  text,
  source      text default 'coming_soon_splash',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint city_waitlist_email_unique unique (email)
);

create index if not exists idx_city_waitlist_voted_city
  on public.city_waitlist (voted_city) where voted_city is not null;

alter table public.city_waitlist enable row level security;

create policy "Anyone can join the waitlist"
  on public.city_waitlist for insert with check (true);

create policy "Anyone can read waitlist for vote counts"
  on public.city_waitlist for select using (true);

create policy "Anyone can update their own waitlist entry"
  on public.city_waitlist for update using (true) with check (true);

create or replace function public.city_waitlist_set_updated_at()
  returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger city_waitlist_updated_at
  before update on public.city_waitlist
  for each row execute function public.city_waitlist_set_updated_at();

comment on table public.city_waitlist is
  'Email signups + city votes from the Coming Soon splash (DMV-first launch gate)';
