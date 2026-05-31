-- hangout_crew: stores shared hangout plans (token-keyed, no auth required to view)
create table if not exists hangout_crew (
  id           uuid primary key default gen_random_uuid(),
  token        text unique not null,
  occasion     text,
  occasion_key text,
  city         text,
  start_time   text,
  date         text,
  mode         text,
  plan         jsonb not null,
  host_name    text,
  generated_at timestamptz default now(),
  expires_at   timestamptz,
  created_at   timestamptz default now()
);

-- hangout_claims: tracks which guest claimed which item on a shared hangout
create table if not exists hangout_claims (
  id               uuid primary key default gen_random_uuid(),
  hangout_id       uuid not null references hangout_crew(id) on delete cascade,
  item_category    text not null check (item_category in ('menu','drinks','supplies','grocery','games')),
  item_key         text not null,
  item_label       text,
  claimed_by_name  text not null,
  claimed_by_token text not null,
  note             text,
  claimed_at       timestamptz default now(),
  unique (hangout_id, item_category, item_key)
);

-- No auth needed to read shared hangouts (token acts as access key)
alter table hangout_crew  enable row level security;
alter table hangout_claims enable row level security;

create policy "Anyone can read hangout_crew via token"
  on hangout_crew for select using (true);

create policy "Anyone can read hangout_claims"
  on hangout_claims for select using (true);

-- Writes go through the edge function (service role) — no client-side write policies needed

-- Enable realtime so subscribeClaims() in the frontend gets live updates
alter publication supabase_realtime add table hangout_claims;
