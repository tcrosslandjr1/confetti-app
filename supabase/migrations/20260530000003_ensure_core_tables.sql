-- Ensures core tables exist. All statements use IF NOT EXISTS — safe to re-run.

-- ── from 20260508182530_13e18132-29b8-4f49-a420-19bf6f5afea9.sql ──
-- Role enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
  END IF;
END $$;;

-- user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='users read own roles') THEN
    CREATE POLICY "users read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='admins manage roles') THEN
    CREATE POLICY "admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Auto-grant 'customer' role on signup (extends existing handle_new_user pattern)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;




-- ── from 20260509161538_d820f28f-2aeb-430f-8b19-e7870222a657.sql ──

-- Advertisers (business accounts)
CREATE TABLE IF NOT EXISTS public.advertisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  business_name text NOT NULL,
  website text,
  contact_email text NOT NULL,
  contact_phone text,
  category text,
  city text,
  status text NOT NULL DEFAULT 'pending', -- pending|approved|suspended
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS advertisers_owner_idx ON public.advertisers(owner_id);
CREATE INDEX IF NOT EXISTS advertisers_status_idx ON public.advertisers(status);

ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='advertisers' AND policyname='advertisers owner read') THEN
    CREATE POLICY "advertisers owner read"
  ON public.advertisers FOR SELECT
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='advertisers' AND policyname='advertisers owner insert') THEN
    CREATE POLICY "advertisers owner insert"
  ON public.advertisers FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='advertisers' AND policyname='advertisers owner update') THEN
    CREATE POLICY "advertisers owner update"
  ON public.advertisers FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='advertisers' AND policyname='advertisers admin delete') THEN
    CREATE POLICY "advertisers admin delete"
  ON public.advertisers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Campaigns
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  venue_id uuid,
  placement text NOT NULL DEFAULT 'featured_card', -- featured_card|itinerary_boost|home_spotlight
  package_tier text NOT NULL DEFAULT 'starter',    -- starter|featured|spotlight
  headline text NOT NULL,
  blurb text,
  image_url text,
  cta_url text,
  cta_label text,
  city text,
  category text,
  status text NOT NULL DEFAULT 'draft', -- draft|pending|approved|rejected|paused
  admin_note text,
  runs_from timestamptz,
  runs_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_campaigns_advertiser_idx ON public.ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS ad_campaigns_status_idx ON public.ad_campaigns(status);
CREATE INDEX IF NOT EXISTS ad_campaigns_placement_idx ON public.ad_campaigns(placement);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Public can see approved + currently running
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ad_campaigns' AND policyname='ad_campaigns public running read') THEN
    CREATE POLICY "ad_campaigns public running read"
  ON public.ad_campaigns FOR SELECT
  USING (
    status = 'approved'
    AND (runs_from IS NULL OR runs_from <= now())
    AND (runs_until IS NULL OR runs_until >= now())
  );
  END IF;
END $$;

-- Advertiser owner can read all of their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ad_campaigns' AND policyname='ad_campaigns owner read') THEN
    CREATE POLICY "ad_campaigns owner read"
  ON public.ad_campaigns FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.advertisers a
            WHERE a.id = ad_campaigns.advertiser_id
              AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ad_campaigns' AND policyname='ad_campaigns owner insert') THEN
    CREATE POLICY "ad_campaigns owner insert"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.advertisers a
            WHERE a.id = ad_campaigns.advertiser_id
              AND a.owner_id = auth.uid())
  );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ad_campaigns' AND policyname='ad_campaigns owner or admin update') THEN
    CREATE POLICY "ad_campaigns owner or admin update"
  ON public.ad_campaigns FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.advertisers a
            WHERE a.id = ad_campaigns.advertiser_id
              AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.advertisers a
            WHERE a.id = ad_campaigns.advertiser_id
              AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ad_campaigns' AND policyname='ad_campaigns owner or admin delete') THEN
    CREATE POLICY "ad_campaigns owner or admin delete"
  ON public.ad_campaigns FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.advertisers a
            WHERE a.id = ad_campaigns.advertiser_id
              AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );
  END IF;
END $$;

-- Events (impressions & clicks)
CREATE TABLE IF NOT EXISTS public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  kind text NOT NULL, -- impression|click
  surface text,       -- where it rendered (e.g. portal_home, nearby_rail)
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_events_campaign_idx ON public.ad_events(campaign_id);
CREATE INDEX IF NOT EXISTS ad_events_created_idx ON public.ad_events(created_at);

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

-- Anyone may record an event (kind validated client-side; cheap and bounded)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ad_events' AND policyname='ad_events anyone insert') THEN
    CREATE POLICY "ad_events anyone insert"
  ON public.ad_events FOR INSERT
  WITH CHECK (kind IN ('impression','click'));
  END IF;
END $$;

-- Owner of the advertiser or admin can read events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ad_events' AND policyname='ad_events owner or admin read') THEN
    CREATE POLICY "ad_events owner or admin read"
  ON public.ad_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      JOIN public.advertisers a ON a.id = c.advertiser_id
      WHERE c.id = ad_events.campaign_id
        AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
  END IF;
END $$;

-- updated_at triggers



-- ── from 20260513230241_06b28112-e5ff-4495-97af-dec25cd71e52.sql ──

-- Subscriptions (stub billing)
CREATE TABLE IF NOT EXISTS public.advertiser_subscriptions (
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='advertiser_subscriptions' AND policyname='subs owner read') THEN
    CREATE POLICY "subs owner read" ON public.advertiser_subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='advertiser_subscriptions' AND policyname='subs owner upsert') THEN
    CREATE POLICY "subs owner upsert" ON public.advertiser_subscriptions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='advertiser_subscriptions' AND policyname='subs owner update') THEN
    CREATE POLICY "subs owner update" ON public.advertiser_subscriptions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='advertiser_subscriptions' AND policyname='subs admin delete') THEN
    CREATE POLICY "subs admin delete" ON public.advertiser_subscriptions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;



-- Venue claims (tiered verification)
CREATE TABLE IF NOT EXISTS public.venue_claims (
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='venue_claims' AND policyname='claims owner read') THEN
    CREATE POLICY "claims owner read" ON public.venue_claims FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='venue_claims' AND policyname='claims owner insert') THEN
    CREATE POLICY "claims owner insert" ON public.venue_claims FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='venue_claims' AND policyname='claims owner update') THEN
    CREATE POLICY "claims owner update" ON public.venue_claims FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='venue_claims' AND policyname='claims admin delete') THEN
    CREATE POLICY "claims admin delete" ON public.venue_claims FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;



CREATE INDEX IF NOT EXISTS idx_venue_claims_venue ON public.venue_claims(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_claims_advertiser ON public.venue_claims(advertiser_id);

-- ── from 20260509172120_e98896ed-481e-4e45-90b9-5ce04b8a165c.sql ──
-- Linked third-party social accounts (TikTok, future: Instagram, etc.)
CREATE TABLE IF NOT EXISTS public.linked_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  username text,
  display_name text,
  avatar_url text,
  scope text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.linked_social_accounts ENABLE ROW LEVEL SECURITY;

-- Users can read their own linked accounts (but tokens stay server-side via select column scope in code)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='linked_social_accounts' AND policyname='linked_social_accounts own read') THEN
    CREATE POLICY "linked_social_accounts own read"
  ON public.linked_social_accounts FOR SELECT
  USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can disconnect their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='linked_social_accounts' AND policyname='linked_social_accounts own delete') THEN
    CREATE POLICY "linked_social_accounts own delete"
  ON public.linked_social_accounts FOR DELETE
  USING (auth.uid() = user_id);
  END IF;
END $$;

-- No public insert/update — only the server (service role) writes here.

CREATE INDEX IF NOT EXISTS idx_linked_social_accounts_user ON public.linked_social_accounts(user_id);

-- Short-lived OAuth state rows for the TikTok authorization handshake
CREATE TABLE IF NOT EXISTS public.tiktok_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  redirect_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  consumed_at timestamptz
);

ALTER TABLE public.tiktok_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies: only service role accesses this table.

CREATE INDEX IF NOT EXISTS idx_tiktok_oauth_states_expires ON public.tiktok_oauth_states(expires_at);

-- Touch updated_at on linked_social_accounts
CREATE OR REPLACE FUNCTION public.touch_linked_social_accounts_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


-- ── from 20260511012200_84c0662d-57b9-436a-bfad-d3004f452eeb.sql ──

-- Viral venues cache: top-trending venues by city, refreshed daily
CREATE TABLE IF NOT EXISTS public.viral_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  venue_name text NOT NULL,
  normalized_name text NOT NULL,
  google_place_id text,
  address text,
  neighborhood text,
  lat numeric,
  lng numeric,
  photo_url text,
  rating numeric,
  trend_score numeric NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  mention_count integer NOT NULL DEFAULT 1,
  last_mentioned_at timestamptz NOT NULL DEFAULT now(),
  source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  verified boolean NOT NULL DEFAULT false,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, normalized_name)
);

CREATE INDEX IF NOT EXISTS viral_venues_city_score_idx ON public.viral_venues (city, trend_score DESC);
CREATE INDEX IF NOT EXISTS viral_venues_tags_idx ON public.viral_venues USING GIN (tags);

ALTER TABLE public.viral_venues ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='viral_venues' AND policyname='viral_venues public read') THEN
    CREATE POLICY "viral_venues public read"
  ON public.viral_venues FOR SELECT
  USING (verified = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='viral_venues' AND policyname='viral_venues admin all') THEN
    CREATE POLICY "viral_venues admin all"
  ON public.viral_venues FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Discovery run log
CREATE TABLE IF NOT EXISTS public.viral_discovery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  queries_run integer NOT NULL DEFAULT 0,
  candidates_found integer NOT NULL DEFAULT 0,
  venues_upserted integer NOT NULL DEFAULT 0,
  duration_ms integer,
  error text
);

CREATE INDEX IF NOT EXISTS viral_discovery_runs_started_idx ON public.viral_discovery_runs (started_at DESC);

ALTER TABLE public.viral_discovery_runs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='viral_discovery_runs' AND policyname='viral_discovery_runs admin read') THEN
    CREATE POLICY "viral_discovery_runs admin read"
  ON public.viral_discovery_runs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- ── from 20260517204019_092b00fb-e834-4986-9527-afe5b8aa2575.sql ──
-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='promoter_status') THEN
    CREATE TYPE public.promoter_status AS ENUM ('pending','approved','suspended','rejected');
  END IF;
END $$;;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='promoter_job_status') THEN
    CREATE TYPE public.promoter_job_status AS ENUM ('draft','offered','accepted','funded','in_progress','delivered','verified','paid','cancelled','refunded','disputed');
  END IF;
END $$;;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='promoter_submission_status') THEN
    CREATE TYPE public.promoter_submission_status AS ENUM ('pending','approved','rejected','needs_revision');
  END IF;
END $$;;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='promoter_payout_status') THEN
    CREATE TYPE public.promoter_payout_status AS ENUM ('pending','processing','paid','failed','reversed');
  END IF;
END $$;;

-- promoters
CREATE TABLE IF NOT EXISTS public.promoters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  niche text[] NOT NULL DEFAULT '{}',
  cities text[] NOT NULL DEFAULT '{}',
  rate_card jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  sample_links text[] NOT NULL DEFAULT '{}',
  status public.promoter_status NOT NULL DEFAULT 'pending',
  rating numeric(3,2),
  jobs_completed int NOT NULL DEFAULT 0,
  stripe_account_id text,
  stripe_payouts_enabled boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promoters_status ON public.promoters(status);
CREATE INDEX IF NOT EXISTS idx_promoters_cities ON public.promoters USING GIN(cities);
CREATE INDEX IF NOT EXISTS idx_promoters_niche ON public.promoters USING GIN(niche);

ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoters' AND policyname='promoters public read approved') THEN
    CREATE POLICY "promoters public read approved" ON public.promoters
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoters' AND policyname='promoters self insert') THEN
    CREATE POLICY "promoters self insert" ON public.promoters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoters' AND policyname='promoters self update') THEN
    CREATE POLICY "promoters self update" ON public.promoters
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoters' AND policyname='promoters admin delete') THEN
    CREATE POLICY "promoters admin delete" ON public.promoters
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

-- promoter_jobs
CREATE TABLE IF NOT EXISTS public.promoter_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL,
  promoter_id uuid NOT NULL REFERENCES public.promoters(id) ON DELETE RESTRICT,
  venue_id uuid,
  title text NOT NULL,
  brief text NOT NULL,
  deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
  amount_cents int NOT NULL CHECK (amount_cents >= 0),
  platform_fee_bps int NOT NULL DEFAULT 1000 CHECK (platform_fee_bps BETWEEN 0 AND 10000),
  currency text NOT NULL DEFAULT 'usd',
  status public.promoter_job_status NOT NULL DEFAULT 'draft',
  boarding_pass_itinerary_id uuid REFERENCES public.itineraries(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  due_at timestamptz,
  accepted_at timestamptz,
  funded_at timestamptz,
  delivered_at timestamptz,
  verified_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promoter_jobs_advertiser ON public.promoter_jobs(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_promoter_jobs_promoter ON public.promoter_jobs(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_jobs_status ON public.promoter_jobs(status);

ALTER TABLE public.promoter_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_jobs' AND policyname='promoter_jobs participants read') THEN
    CREATE POLICY "promoter_jobs participants read" ON public.promoter_jobs
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = promoter_jobs.advertiser_id AND a.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.promoters p WHERE p.id = promoter_jobs.promoter_id AND p.user_id = auth.uid())
  );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_jobs' AND policyname='promoter_jobs advertiser insert') THEN
    CREATE POLICY "promoter_jobs advertiser insert" ON public.promoter_jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
  );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_jobs' AND policyname='promoter_jobs participants update') THEN
    CREATE POLICY "promoter_jobs participants update" ON public.promoter_jobs
  FOR UPDATE USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = promoter_jobs.advertiser_id AND a.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.promoters p WHERE p.id = promoter_jobs.promoter_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = promoter_jobs.advertiser_id AND a.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.promoters p WHERE p.id = promoter_jobs.promoter_id AND p.user_id = auth.uid())
  );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_jobs' AND policyname='promoter_jobs admin delete') THEN
    CREATE POLICY "promoter_jobs admin delete" ON public.promoter_jobs
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

-- promoter_submissions
CREATE TABLE IF NOT EXISTS public.promoter_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.promoter_jobs(id) ON DELETE CASCADE,
  content_url text NOT NULL,
  platform text NOT NULL,
  caption text,
  posted_at timestamptz,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  verification_status public.promoter_submission_status NOT NULL DEFAULT 'pending',
  boarding_pass_visible boolean NOT NULL DEFAULT false,
  reviewer_id uuid,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promoter_submissions_job ON public.promoter_submissions(job_id);
CREATE INDEX IF NOT EXISTS idx_promoter_submissions_status ON public.promoter_submissions(verification_status);

ALTER TABLE public.promoter_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_submissions' AND policyname='promoter_submissions participants read') THEN
    CREATE POLICY "promoter_submissions participants read" ON public.promoter_submissions
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.promoter_jobs j
      LEFT JOIN public.advertisers a ON a.id = j.advertiser_id
      LEFT JOIN public.promoters p ON p.id = j.promoter_id
      WHERE j.id = promoter_submissions.job_id
        AND (a.owner_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_submissions' AND policyname='promoter_submissions promoter insert') THEN
    CREATE POLICY "promoter_submissions promoter insert" ON public.promoter_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.promoter_jobs j
      JOIN public.promoters p ON p.id = j.promoter_id
      WHERE j.id = job_id AND p.user_id = auth.uid()
    )
  );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_submissions' AND policyname='promoter_submissions admin or promoter update') THEN
    CREATE POLICY "promoter_submissions admin or promoter update" ON public.promoter_submissions
  FOR UPDATE USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.promoter_jobs j
      JOIN public.promoters p ON p.id = j.promoter_id
      WHERE j.id = promoter_submissions.job_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.promoter_jobs j
      JOIN public.promoters p ON p.id = j.promoter_id
      WHERE j.id = promoter_submissions.job_id AND p.user_id = auth.uid()
    )
  );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_submissions' AND policyname='promoter_submissions admin delete') THEN
    CREATE POLICY "promoter_submissions admin delete" ON public.promoter_submissions
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

-- promoter_payouts
CREATE TABLE IF NOT EXISTS public.promoter_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id uuid NOT NULL REFERENCES public.promoters(id) ON DELETE RESTRICT,
  job_id uuid REFERENCES public.promoter_jobs(id) ON DELETE SET NULL,
  amount_cents int NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  status public.promoter_payout_status NOT NULL DEFAULT 'pending',
  stripe_transfer_id text,
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promoter_payouts_promoter ON public.promoter_payouts(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_payouts_job ON public.promoter_payouts(job_id);

ALTER TABLE public.promoter_payouts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_payouts' AND policyname='promoter_payouts owner read') THEN
    CREATE POLICY "promoter_payouts owner read" ON public.promoter_payouts
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.promoters p WHERE p.id = promoter_payouts.promoter_id AND p.user_id = auth.uid())
  );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_payouts' AND policyname='promoter_payouts admin write') THEN
    CREATE POLICY "promoter_payouts admin write" ON public.promoter_payouts
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

-- promoter_metrics_daily
CREATE TABLE IF NOT EXISTS public.promoter_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id uuid NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.promoter_jobs(id) ON DELETE CASCADE,
  date date NOT NULL,
  views int NOT NULL DEFAULT 0,
  engagement int NOT NULL DEFAULT 0,
  clicks int NOT NULL DEFAULT 0,
  bookings_attributed int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promoter_id, job_id, date)
);
CREATE INDEX IF NOT EXISTS idx_promoter_metrics_daily_promoter_date ON public.promoter_metrics_daily(promoter_id, date);

ALTER TABLE public.promoter_metrics_daily ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_metrics_daily' AND policyname='promoter_metrics_daily participants read') THEN
    CREATE POLICY "promoter_metrics_daily participants read" ON public.promoter_metrics_daily
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.promoters p WHERE p.id = promoter_metrics_daily.promoter_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.promoter_jobs j
      JOIN public.advertisers a ON a.id = j.advertiser_id
      WHERE j.id = promoter_metrics_daily.job_id AND a.owner_id = auth.uid()
    )
  );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promoter_metrics_daily' AND policyname='promoter_metrics_daily admin write') THEN
    CREATE POLICY "promoter_metrics_daily admin write" ON public.promoter_metrics_daily
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_promoter_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;





