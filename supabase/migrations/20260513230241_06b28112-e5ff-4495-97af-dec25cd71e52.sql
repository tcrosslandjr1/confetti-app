
-- Subscriptions (stub billing)
CREATE TABLE public.advertiser_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter','featured','spotlight')),
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive','active','past_due','cancelled')),
  current_period_end timestamptz,
  stub boolean NOT NULL DEFAULT true,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advertiser_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subs owner read" ON public.advertiser_subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "subs owner upsert" ON public.advertiser_subscriptions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
);
CREATE POLICY "subs owner update" ON public.advertiser_subscriptions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "subs admin delete" ON public.advertiser_subscriptions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_advertiser_subscriptions_updated_at
BEFORE UPDATE ON public.advertiser_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.touch_corporate_events_updated_at();

-- Venue claims (tiered verification)
CREATE TABLE public.venue_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL,
  venue_id uuid NOT NULL,
  verification_tier text NOT NULL DEFAULT 'self_attest' CHECK (verification_tier IN ('self_attest','email_match','admin_review')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  contact_email text,
  proof_url text,
  notes text,
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (advertiser_id, venue_id)
);

ALTER TABLE public.venue_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "claims owner read" ON public.venue_claims FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "claims owner insert" ON public.venue_claims FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
);
CREATE POLICY "claims owner update" ON public.venue_claims FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "claims admin delete" ON public.venue_claims FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_venue_claims_updated_at
BEFORE UPDATE ON public.venue_claims
FOR EACH ROW EXECUTE FUNCTION public.touch_corporate_events_updated_at();

CREATE INDEX idx_venue_claims_venue ON public.venue_claims(venue_id);
CREATE INDEX idx_venue_claims_advertiser ON public.venue_claims(advertiser_id);
