-- Confetti credits: advertisers buy credits, users earn them on bookings, redeem for cash/discount

CREATE TABLE public.advertiser_confetti_balances (
  advertiser_id uuid PRIMARY KEY,
  balance_credits integer NOT NULL DEFAULT 0,
  lifetime_purchased_credits integer NOT NULL DEFAULT 0,
  lifetime_granted_credits integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advertiser_confetti_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advertiser balance owner read" ON public.advertiser_confetti_balances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id
            AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)))
  );
CREATE POLICY "advertiser balance owner upsert" ON public.advertiser_confetti_balances
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
  );
CREATE POLICY "advertiser balance owner update" ON public.advertiser_confetti_balances
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id
            AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE TABLE public.confetti_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL,
  package_key text NOT NULL,
  credits integer NOT NULL,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.confetti_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases owner read" ON public.confetti_purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id
            AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)))
  );
CREATE POLICY "purchases owner insert" ON public.confetti_purchases
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
  );

CREATE TABLE public.confetti_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  advertiser_id uuid,
  venue_name text,
  booking_id uuid,
  credits integer NOT NULL,
  reason text NOT NULL DEFAULT 'booking',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_confetti_grants_user ON public.confetti_grants(user_id, created_at DESC);
CREATE INDEX idx_confetti_grants_advertiser ON public.confetti_grants(advertiser_id, created_at DESC);

ALTER TABLE public.confetti_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grants user read" ON public.confetti_grants
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
  );
CREATE POLICY "grants user insert" ON public.confetti_grants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.confetti_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  advertiser_id uuid,
  credits integer NOT NULL,
  redeem_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  redeemed_at timestamptz
);

CREATE INDEX idx_confetti_redemptions_user ON public.confetti_redemptions(user_id, created_at DESC);

ALTER TABLE public.confetti_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "redemptions user read" ON public.confetti_redemptions
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
  );
CREATE POLICY "redemptions user insert" ON public.confetti_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "redemptions user or staff update" ON public.confetti_redemptions
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
  );