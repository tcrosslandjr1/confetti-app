-- venue_intel: NAS-populated venue intelligence table
-- Populated by confetti-fetcher cron job on Synology NAS
-- Data sources: TikTok (Bright Data), Google Places, Yelp Fusion

create table if not exists public.venue_intel (
  -- ── Identity ──────────────────────────────────────────────────────────────
  place_id                text primary key,                -- Google place_id or manual_<city>_<slug>_<hash>
  name                    text not null,
  category                text,                           -- e.g. "date night", "nightlife", "brunch"
  subcategory             text,
  tags                    text[] not null default '{}',

  -- ── Location ──────────────────────────────────────────────────────────────
  city                    text,                           -- "DC", "Washington", "Maryland", "Virginia"
  neighborhood            text,
  address                 text,
  latitude                numeric(10, 7),
  longitude               numeric(10, 7),

  -- ── Contact ───────────────────────────────────────────────────────────────
  phone                   text,
  website                 text,
  price_range             text,                           -- "$", "$$", "$$$", "$$$$"
  hours                   jsonb,

  -- ── Content ───────────────────────────────────────────────────────────────
  description             text,
  image_url               text,

  -- ── Google ────────────────────────────────────────────────────────────────
  google_rating           numeric(3, 1),
  google_review_count     integer not null default 0,
  google_types            text[] not null default '{}',

  -- ── Yelp ──────────────────────────────────────────────────────────────────
  yelp_id                 text,
  yelp_rating             numeric(3, 1),
  yelp_review_count       integer not null default 0,
  yelp_url                text,

  -- ── TikTok / Social ───────────────────────────────────────────────────────
  tiktok_mention_count    integer not null default 0,
  tiktok_hashtags         text[] not null default '{}',
  tiktok_video_urls       jsonb,
  tiktok_last_viral_at    timestamptz,

  -- ── Trend Signals ─────────────────────────────────────────────────────────
  trending_score          numeric(5, 2) not null default 0
    check (trending_score >= 0 and trending_score <= 100),
  is_trending             boolean not null default false,
  is_featured             boolean not null default false,

  -- ── Curation ──────────────────────────────────────────────────────────────
  manually_added          boolean not null default false,
  curator_notes           text,

  -- ── Pipeline Metadata ─────────────────────────────────────────────────────
  data_sources            text[] not null default '{}',   -- ["google","yelp","tiktok"]
  web_snippet             text,
  last_fetched_at         timestamptz,

  -- ── Timestamps ────────────────────────────────────────────────────────────
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_venue_intel_city            on public.venue_intel (city);
create index if not exists idx_venue_intel_trending_score  on public.venue_intel (trending_score desc);
create index if not exists idx_venue_intel_is_trending     on public.venue_intel (is_trending) where is_trending = true;
create index if not exists idx_venue_intel_category        on public.venue_intel (category);
create index if not exists idx_venue_intel_last_fetched    on public.venue_intel (last_fetched_at desc);

-- ── updated_at trigger ────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_venue_intel_updated_at on public.venue_intel;
create trigger trg_venue_intel_updated_at
  before update on public.venue_intel
  for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.venue_intel enable row level security;

create policy "Public read venue_intel"
  on public.venue_intel for select using (true);

create policy "Service role can write venue_intel"
  on public.venue_intel for all using (auth.role() = 'service_role');
