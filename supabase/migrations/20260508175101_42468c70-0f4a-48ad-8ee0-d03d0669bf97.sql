
-- profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  level int not null default 1,
  xp int not null default 0,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- preferences
create table public.user_preferences (
  user_id uuid primary key references auth.users on delete cascade,
  cuisines text[] not null default '{}',
  activities text[] not null default '{}',
  budget_min int not null default 0,
  budget_max int not null default 100,
  updated_at timestamptz not null default now()
);
alter table public.user_preferences enable row level security;
create policy "own prefs all" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- threads
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null default 'New chat',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.threads enable row level security;
create policy "own threads all" on public.threads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index threads_user_idx on public.threads(user_id, last_message_at desc);

-- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "own messages all" on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index messages_thread_idx on public.messages(thread_id, created_at);

-- venues (public read)
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  neighborhood text,
  city text,
  price_level int not null default 2,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.venues enable row level security;
create policy "venues public read" on public.venues for select using (true);

-- visits
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  venue_id uuid references public.venues on delete set null,
  venue_name text not null,
  visited_at timestamptz not null default now(),
  notes text,
  xp_earned int not null default 25,
  created_at timestamptz not null default now()
);
alter table public.visits enable row level security;
create policy "own visits all" on public.visits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index visits_user_idx on public.visits(user_id, visited_at desc);

-- achievements catalog (public read)
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text not null,
  icon text not null default 'trophy',
  xp_reward int not null default 100
);
alter table public.achievements enable row level security;
create policy "achievements public read" on public.achievements for select using (true);

-- user achievements
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  achievement_id uuid not null references public.achievements on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
create policy "own ua all" on public.user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- handle new user trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- seed achievements
insert into public.achievements (code, title, description, icon, xp_reward) values
  ('first_visit', 'First Steps', 'Logged your first visit', 'footprints', 50),
  ('night_owl', 'Night Owl', 'Visited 5 nightlife spots', 'moon', 200),
  ('foodie_explorer', 'Foodie Explorer', 'Tried 5 different cuisines', 'utensils', 200),
  ('weekend_warrior', 'Weekend Warrior', '3 visits in one weekend', 'flame', 150),
  ('dmv_native', 'DMV Native', 'Visited 10 unique venues', 'map-pin', 300);

-- seed venues
insert into public.venues (name, category, neighborhood, city, price_level, description) values
  ('Le Diplomate', 'Restaurant', '14th Street', 'Washington, DC', 4, 'Iconic French brasserie with a buzzing patio.'),
  ('Service Bar', 'Cocktail Bar', 'U Street', 'Washington, DC', 3, 'Award-winning cocktails in a low-key neighborhood spot.'),
  ('Maydan', 'Restaurant', 'Logan Circle', 'Washington, DC', 4, 'Open-fire Middle Eastern + North African feasts.'),
  ('The Roof at the Line', 'Rooftop Bar', 'Adams Morgan', 'Washington, DC', 3, 'Rooftop with skyline views and craft drinks.'),
  ('Blues Alley', 'Live Music', 'Georgetown', 'Washington, DC', 3, 'Legendary intimate jazz club since 1965.'),
  ('Ethiopic', 'Restaurant', 'H Street', 'Washington, DC', 2, 'Contemporary Ethiopian dining with a great injera spread.'),
  ('Audi Field', 'Sports', 'Buzzard Point', 'Washington, DC', 3, 'Home of D.C. United and big-night soccer energy.'),
  ('Songbyrd', 'Live Music', 'Union Market', 'Washington, DC', 2, 'Indie record cafe with intimate live shows.'),
  ('Rooster & Owl', 'Restaurant', '14th Street', 'Washington, DC', 4, 'Inventive 4-course tasting menu, husband-and-wife run.'),
  ('Eaton DC', 'Lounge', 'Downtown', 'Washington, DC', 3, 'Hotel lounge with DJs, art, and a creative crowd.');
