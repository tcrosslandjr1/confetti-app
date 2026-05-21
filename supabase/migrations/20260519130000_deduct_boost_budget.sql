-- ============================================================
-- Phase 2.4 — Atomic boost-budget deduction.
-- Locks the business_accounts row FOR UPDATE so concurrent triggers
-- can't read the same balance and double-deduct.
-- ============================================================

create or replace function public.deduct_boost_budget(
  p_campaign_id uuid,
  p_amount numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_balance numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'p_amount must be > 0';
  end if;

  -- Resolve the campaign's business and lock its row.
  select bc.business_id into v_business_id
  from public.boost_campaigns bc
  where bc.id = p_campaign_id;

  if v_business_id is null then
    raise exception 'campaign % not found', p_campaign_id;
  end if;

  -- Acquire row lock; subsequent concurrent calls block until we commit.
  select credit_balance into v_balance
  from public.business_accounts
  where id = v_business_id
  for update;

  if v_balance is null then
    raise exception 'business % not found', v_business_id;
  end if;

  if v_balance < p_amount then
    update public.boost_campaigns
      set status = 'paused'
      where id = p_campaign_id;
    return jsonb_build_object('status', 'paused', 'balance', v_balance);
  end if;

  update public.business_accounts
    set credit_balance = credit_balance - p_amount
    where id = v_business_id;

  return jsonb_build_object('status', 'deducted', 'balance', v_balance - p_amount);
end;
$$;

revoke all on function public.deduct_boost_budget(uuid, numeric) from public, anon, authenticated;
grant execute on function public.deduct_boost_budget(uuid, numeric) to service_role;
