-- ============================================================
-- Phase 2.5 — Postgres-backed token-bucket rate limiter.
-- Used by edge functions via the consume_rate_limit() RPC.
-- ============================================================

create table if not exists public.rate_limit_buckets (
  key text primary key,
  tokens numeric not null,
  last_refill timestamptz not null default now()
);

alter table public.rate_limit_buckets enable row level security;
-- No public policies: only callable via SECURITY DEFINER RPC below.

create index if not exists rate_limit_buckets_last_refill_idx
  on public.rate_limit_buckets (last_refill);

-- ─── Atomic token-bucket consume ──────────────────────────────────
-- p_key:            bucket identifier (e.g. "ai-chat:user:<uuid>" or
--                   "ai-chat:ip:1.2.3.4")
-- p_burst:          maximum tokens in the bucket
-- p_refill_per_sec: tokens added per second (e.g. 0.333 for 20/min)
-- Returns true if a token was consumed; false if the bucket was empty.
create or replace function public.consume_rate_limit(
  p_key text,
  p_burst integer,
  p_refill_per_sec numeric
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tokens numeric;
  v_now timestamptz := clock_timestamp();
begin
  if p_burst <= 0 or p_refill_per_sec <= 0 then
    raise exception 'rate-limit params must be positive';
  end if;

  insert into public.rate_limit_buckets(key, tokens, last_refill)
  values (p_key, p_burst::numeric - 1, v_now)
  on conflict (key) do update
    set tokens = least(
          p_burst::numeric,
          rate_limit_buckets.tokens
            + extract(epoch from (v_now - rate_limit_buckets.last_refill)) * p_refill_per_sec
        ) - 1,
        last_refill = v_now
  returning tokens into v_tokens;

  if v_tokens < 0 then
    -- Bucket empty: refund the token we just deducted.
    update public.rate_limit_buckets
      set tokens = tokens + 1
      where key = p_key;
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, numeric) from public, anon;
grant execute on function public.consume_rate_limit(text, integer, numeric) to authenticated, service_role;

-- ─── Periodic cleanup of stale buckets ────────────────────────────
-- A bucket whose last_refill is older than its full-refill window is
-- mathematically indistinguishable from "doesn't exist". Vacuum so the
-- table doesn't grow unbounded across millions of IPs.
create or replace function public.gc_rate_limit_buckets()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limit_buckets
  where last_refill < now() - interval '1 hour';
$$;

revoke all on function public.gc_rate_limit_buckets() from public, anon, authenticated;
grant execute on function public.gc_rate_limit_buckets() to service_role;
