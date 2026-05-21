alter table public.profiles
  add column if not exists username text,
  add column if not exists auth_provider text not null default 'email',
  add column if not exists last_login_at timestamptz;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format'
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username is null or username ~ '^[A-Za-z0-9_]{3,24}$');
  end if;
end $$;

create table if not exists public.profile_social_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google', 'apple', 'instagram', 'tiktok', 'yelp', 'spotify', 'x')),
  provider_user_id text,
  provider_email text,
  connected_at timestamptz not null default now(),
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, provider)
);

alter table public.profile_social_links enable row level security;

drop policy if exists "Users can view own social links" on public.profile_social_links;
create policy "Users can view own social links"
  on public.profile_social_links for select
  using (auth.uid() = user_id);

drop policy if exists "Users can manage own social links" on public.profile_social_links;
create policy "Users can manage own social links"
  on public.profile_social_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.resolve_login_identifier(login_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_email text;
begin
  if login_identifier is null or length(trim(login_identifier)) = 0 then
    return null;
  end if;

  if position('@' in login_identifier) > 0 then
    return lower(trim(login_identifier));
  end if;

  select email
    into matched_email
    from public.profiles
   where lower(username) = lower(trim(login_identifier))
   limit 1;

  return matched_email;
end;
$$;

revoke all on function public.resolve_login_identifier(text) from public;
grant execute on function public.resolve_login_identifier(text) to anon, authenticated;
