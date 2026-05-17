
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vip_until timestamptz,
  ADD COLUMN IF NOT EXISTS confetti_pts integer NOT NULL DEFAULT 0;

ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS qr_token text UNIQUE;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pending_price_id text,
  ADD COLUMN IF NOT EXISTS tier text;

CREATE TABLE IF NOT EXISTS public.confetti_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_confetti_ledger_user ON public.confetti_ledger(user_id, created_at DESC);

ALTER TABLE public.confetti_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own ledger read" ON public.confetti_ledger;
CREATE POLICY "own ledger read" ON public.confetti_ledger
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service role manages ledger" ON public.confetti_ledger;
CREATE POLICY "service role manages ledger" ON public.confetti_ledger
  FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.award_confetti_pts(
  _user uuid, _amount integer, _reason text, _ref text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _amount IS NULL OR _amount = 0 THEN RETURN; END IF;
  UPDATE public.profiles
     SET confetti_pts = GREATEST(0, confetti_pts + _amount),
         updated_at = now()
   WHERE id = _user;
  INSERT INTO public.confetti_ledger (user_id, amount, reason, reference_id)
  VALUES (_user, _amount, _reason, _ref);
END $$;
