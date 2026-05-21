-- ═══════════════════════════════════════════════════════════
-- Boost Credits — Monetization Tables
-- Businesses buy credits → boost visibility → users earn Confetti + coupons
-- ═══════════════════════════════════════════════════════════

-- ─── Business Accounts ──────────────────────────────────────
create table if not exists public.business_accounts (
  id text primary key,
  business_name text not null,
  contact_name text not null,
  contact_email text not null,
  phone text,
  tier text not null default 'spotlight'
    check (tier in ('spotlight', 'boost', 'partner', 'enterprise')),
  credit_balance integer not null default 0,
  total_credits_used integer not null default 0,
  venue_ids text[] default '{}',
  logo_url text,
  website text,
  city text not null,
  state text,
  owner_user_id uuid references auth.users(id) on delete set null,
  is_active boolean default true,
  joined_at timestamptz default now()
);

create index idx_business_accounts_city on public.business_accounts(city);
create index idx_business_accounts_tier on public.business_accounts(tier);
create index idx_business_accounts_owner on public.business_accounts(owner_user_id);

-- ─── Boost Campaigns ────────────────────────────────────────
create table if not exists public.boost_campaigns (
  id text primary key,
  business_id text not null references public.business_accounts(id) on delete cascade,
  venue_id text not null,
  name text not null,
  status text not null default 'draft'
    check (status in ('active', 'paused', 'ended', 'draft')),
  target_vibes text[] default '{}',
  target_categories text[] default '{}',
  target_occasions text[] default '{}',
  target_price_range text,
  target_cities text[] default '{}',
  daily_credit_budget integer not null default 50,
  total_credits_spent integer not null default 0,
  impressions integer not null default 0,
  click_throughs integer not null default 0,
  check_ins integer not null default 0,
  coupon_id text, -- set after coupon creation
  boost_strength integer not null default 5
    check (boost_strength between 1 and 10),
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz default now()
);

create index idx_boost_campaigns_business on public.boost_campaigns(business_id);
create index idx_boost_campaigns_venue on public.boost_campaigns(venue_id);
create index idx_boost_campaigns_status on public.boost_campaigns(status);
create index idx_boost_campaigns_cities on public.boost_campaigns using gin(target_cities);

-- ─── Coupons ────────────────────────────────────────────────
create table if not exists public.coupons (
  id text primary key,
  business_id text not null references public.business_accounts(id) on delete cascade,
  campaign_id text references public.boost_campaigns(id) on delete set null,
  venue_id text not null,
  type text not null
    check (type in ('percent_off', 'dollar_off', 'free_item', 'bogo', 'experience')),
  title text not null,
  description text not null default '',
  value numeric not null default 0, -- percent or dollar amount
  free_item text, -- e.g. "Free appetizer"
  min_spend numeric,
  max_redemptions integer,
  current_redemptions integer not null default 0,
  visits_required integer not null default 1,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_coupons_business on public.coupons(business_id);
create index idx_coupons_campaign on public.coupons(campaign_id);
create index idx_coupons_venue on public.coupons(venue_id);

-- Wire up FK on boost_campaigns.coupon_id
alter table public.boost_campaigns
  add constraint fk_boost_campaigns_coupon
  foreign key (coupon_id) references public.coupons(id) on delete set null;

-- ─── User Check-ins ─────────────────────────────────────────
create table if not exists public.user_checkins (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id text not null,
  campaign_id text references public.boost_campaigns(id) on delete set null,
  method text not null default 'gps'
    check (method in ('gps', 'qr', 'nfc', 'manual')),
  lat double precision not null,
  lng double precision not null,
  verified_at timestamptz default now(),
  confetti_earned integer not null default 0,
  coupon_unlocked text references public.coupons(id) on delete set null
);

create index idx_user_checkins_user on public.user_checkins(user_id);
create index idx_user_checkins_venue on public.user_checkins(venue_id);
create index idx_user_checkins_campaign on public.user_checkins(campaign_id);
create index idx_user_checkins_verified on public.user_checkins(verified_at desc);

-- ─── Coupon Redemptions ─────────────────────────────────────
create table if not exists public.coupon_redemptions (
  id text primary key,
  coupon_id text not null references public.coupons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id text not null,
  status text not null default 'available'
    check (status in ('available', 'claimed', 'redeemed', 'expired')),
  unlocked_at timestamptz default now(),
  redeemed_at timestamptz,
  expires_at timestamptz not null,
  unique(coupon_id, user_id)
);

create index idx_coupon_redemptions_user on public.coupon_redemptions(user_id);
create index idx_coupon_redemptions_coupon on public.coupon_redemptions(coupon_id);
create index idx_coupon_redemptions_status on public.coupon_redemptions(status);

-- ─── User Subscriptions ─────────────────────────────────────
create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free'
    check (tier in ('free', 'black')),
  confetti_balance integer not null default 0,
  total_confetti_earned integer not null default 0,
  total_coupons_redeemed integer not null default 0,
  total_check_ins integer not null default 0,
  plans_used_this_month integer not null default 0,
  plan_limit integer not null default 3,
  outing_credit_balance numeric(6,2) not null default 0,
  outing_credit_used_this_month numeric(6,2) not null default 0,
  prime_reservations integer not null default 0,
  prime_reservations_used_this_month integer not null default 0,
  subscribed_at timestamptz,
  renews_at timestamptz,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════

alter table public.business_accounts enable row level security;
alter table public.boost_campaigns enable row level security;
alter table public.coupons enable row level security;
alter table public.user_checkins enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.user_subscriptions enable row level security;

-- Business Accounts: owner manages, everyone reads (for venue display)
create policy "Anyone can read active businesses"
  on public.business_accounts for select
  using (is_active = true);

create policy "Owner manages own business"
  on public.business_accounts for all
  using (owner_user_id = auth.uid());

-- Boost Campaigns: business owner manages, users read active
create policy "Anyone can read active campaigns"
  on public.boost_campaigns for select
  using (status = 'active');

create policy "Business owner manages campaigns"
  on public.boost_campaigns for all
  using (
    business_id in (
      select id from public.business_accounts
      where owner_user_id = auth.uid()
    )
  );

-- Coupons: business owner manages, users read active
create policy "Anyone can read active coupons"
  on public.coupons for select
  using (is_active = true);

create policy "Business owner manages coupons"
  on public.coupons for all
  using (
    business_id in (
      select id from public.business_accounts
      where owner_user_id = auth.uid()
    )
  );

-- Check-ins: user manages own
create policy "Users manage own check-ins"
  on public.user_checkins for all
  using (user_id = auth.uid());

-- Business can read check-ins for their campaigns
create policy "Business reads campaign check-ins"
  on public.user_checkins for select
  using (
    campaign_id in (
      select id from public.boost_campaigns
      where business_id in (
        select id from public.business_accounts
        where owner_user_id = auth.uid()
      )
    )
  );

-- Coupon Redemptions: user manages own
create policy "Users manage own redemptions"
  on public.coupon_redemptions for all
  using (user_id = auth.uid());

-- Business can read redemptions for their coupons
create policy "Business reads coupon redemptions"
  on public.coupon_redemptions for select
  using (
    coupon_id in (
      select id from public.coupons
      where business_id in (
        select id from public.business_accounts
        where owner_user_id = auth.uid()
      )
    )
  );

-- Subscriptions: user manages own
create policy "Users manage own subscription"
  on public.user_subscriptions for all
  using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- Monthly plan counter reset function
-- Resets plans_used_this_month to 0 on the 1st of each month
-- (Call via pg_cron or Supabase scheduled function)
-- ═══════════════════════════════════════════════════════════
create or replace function public.reset_monthly_plans()
returns void as $$
begin
  -- Reset plan counter for all users
  update public.user_subscriptions
  set plans_used_this_month = 0;

  -- Reset Black-exclusive perks: reload outing credits + prime reservations
  update public.user_subscriptions
  set
    outing_credit_balance = 10.00,
    outing_credit_used_this_month = 0,
    prime_reservations = 3,
    prime_reservations_used_this_month = 0
  where tier = 'black';
end;
$$ language plpgsql security definer;
