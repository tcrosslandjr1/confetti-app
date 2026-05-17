create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_type text not null default 'user' check (account_type in ('user','business','corporate')),
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  product_id text not null,
  price_id text not null,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  environment text not null default 'sandbox',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_id on public.subscriptions(stripe_subscription_id);
alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Service role manages subscriptions" on public.subscriptions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table public.user_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,
  product_id text not null,
  price_id text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  environment text not null default 'sandbox',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_user_purchases_user_id on public.user_purchases(user_id);
alter table public.user_purchases enable row level security;
create policy "Users can view own purchases" on public.user_purchases for select using (auth.uid() = user_id);
create policy "Service role manages purchases" on public.user_purchases for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table public.vendor_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  vendor_type text not null check (vendor_type in ('venue','promoter','partner','corporate_host')),
  stripe_account_id text not null unique,
  payout_schedule text default 'weekly',
  charges_enabled boolean default false,
  payouts_enabled boolean default false,
  details_submitted boolean default false,
  environment text not null default 'sandbox',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_vendor_accounts_user_id on public.vendor_accounts(user_id);
alter table public.vendor_accounts enable row level security;
create policy "Vendors view own account" on public.vendor_accounts for select using (auth.uid() = user_id);
create policy "Service role manages vendor accounts" on public.vendor_accounts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table public.vendor_payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_account_id uuid references public.vendor_accounts(id) on delete cascade not null,
  stripe_transfer_id text unique,
  stripe_payout_id text unique,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  related_purchase_id uuid references public.user_purchases(id) on delete set null,
  environment text not null default 'sandbox',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_vendor_payouts_vendor on public.vendor_payouts(vendor_account_id);
alter table public.vendor_payouts enable row level security;
create policy "Vendors view own payouts" on public.vendor_payouts for select using (exists (
  select 1 from public.vendor_accounts va where va.id = vendor_payouts.vendor_account_id and va.user_id = auth.uid()
));
create policy "Service role manages vendor payouts" on public.vendor_payouts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  environment text not null default 'sandbox',
  payload jsonb not null,
  processed_at timestamptz default now(),
  error text
);
create index idx_stripe_webhook_events_type on public.stripe_webhook_events(event_type);
alter table public.stripe_webhook_events enable row level security;
create policy "Service role manages webhook events" on public.stripe_webhook_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function public.has_active_subscription(user_uuid uuid, check_env text default 'live')
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid and environment = check_env
      and (
        (status in ('active','trialing') and (current_period_end is null or current_period_end > now()))
        or (status = 'canceled' and current_period_end > now())
      )
  );
$$;

create trigger trg_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger trg_user_purchases_updated_at before update on public.user_purchases for each row execute function public.set_updated_at();
create trigger trg_vendor_accounts_updated_at before update on public.vendor_accounts for each row execute function public.set_updated_at();
create trigger trg_vendor_payouts_updated_at before update on public.vendor_payouts for each row execute function public.set_updated_at();