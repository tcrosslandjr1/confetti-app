-- ═══════════════════════════════════════════════════════════
-- Wallet Passes & Confetti Fund
-- Apple/Google Wallet passes for Confetti Black subscribers
-- Self-funded credit pool for outing credit disbursement
-- ═══════════════════════════════════════════════════════════

-- ─── Confetti Fund ─────────────────────────────────────────
-- Single fund pool that admin (Tyrone) loads with real dollars.
-- Disbursements deducted when users redeem outing credits at venues.
create table if not exists public.confetti_fund (
  id text primary key,
  balance numeric(10,2) not null default 0,
  total_deposited numeric(10,2) not null default 0,
  total_disbursed numeric(10,2) not null default 0,
  total_transactions integer not null default 0,
  created_at timestamptz default now(),
  last_deposit_at timestamptz
);

-- ─── Fund Transactions ─────────────────────────────────────
create table if not exists public.fund_transactions (
  id text primary key,
  fund_id text not null references public.confetti_fund(id) on delete cascade,
  type text not null
    check (type in ('deposit', 'disbursement', 'refund', 'adjustment')),
  amount numeric(10,2) not null,
  balance_after numeric(10,2) not null,
  description text not null default '',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_fund_transactions_fund on public.fund_transactions(fund_id);
create index idx_fund_transactions_user on public.fund_transactions(user_id);
create index idx_fund_transactions_type on public.fund_transactions(type);
create index idx_fund_transactions_created on public.fund_transactions(created_at desc);

-- ─── Wallet Passes ─────────────────────────────────────────
create table if not exists public.wallet_passes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null
    check (platform in ('apple', 'google')),
  status text not null default 'active'
    check (status in ('active', 'expired', 'revoked')),
  serial_number text not null unique,
  barcode text not null unique,
  barcode_format text not null default 'qr'
    check (barcode_format in ('qr', 'code128', 'pdf417')),
  credit_balance numeric(6,2) not null default 0,
  tier text not null default 'black'
    check (tier in ('black')),
  pass_url text not null,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

create index idx_wallet_passes_user on public.wallet_passes(user_id);
create index idx_wallet_passes_status on public.wallet_passes(status);
create index idx_wallet_passes_barcode on public.wallet_passes(barcode);
create index idx_wallet_passes_serial on public.wallet_passes(serial_number);

-- ═══════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════

alter table public.confetti_fund enable row level security;
alter table public.fund_transactions enable row level security;
alter table public.wallet_passes enable row level security;

-- Confetti Fund: read-only for authenticated users (admin writes via service role)
create policy "Authenticated users can read fund"
  on public.confetti_fund for select
  using (auth.role() = 'authenticated');

-- Fund Transactions: users see their own disbursements, admin sees all
create policy "Users see own disbursements"
  on public.fund_transactions for select
  using (user_id = auth.uid() or type = 'deposit');

-- Wallet Passes: users manage own passes
create policy "Users manage own passes"
  on public.wallet_passes for select
  using (user_id = auth.uid());

create policy "Users can update own passes"
  on public.wallet_passes for update
  using (user_id = auth.uid());
