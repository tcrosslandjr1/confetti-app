
-- Advertisers (business accounts)
CREATE TABLE public.advertisers (
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
CREATE INDEX advertisers_owner_idx ON public.advertisers(owner_id);
CREATE INDEX advertisers_status_idx ON public.advertisers(status);

ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advertisers owner read"
  ON public.advertisers FOR SELECT
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "advertisers owner insert"
  ON public.advertisers FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "advertisers owner update"
  ON public.advertisers FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "advertisers admin delete"
  ON public.advertisers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Campaigns
CREATE TABLE public.ad_campaigns (
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
CREATE INDEX ad_campaigns_advertiser_idx ON public.ad_campaigns(advertiser_id);
CREATE INDEX ad_campaigns_status_idx ON public.ad_campaigns(status);
CREATE INDEX ad_campaigns_placement_idx ON public.ad_campaigns(placement);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Public can see approved + currently running
CREATE POLICY "ad_campaigns public running read"
  ON public.ad_campaigns FOR SELECT
  USING (
    status = 'approved'
    AND (runs_from IS NULL OR runs_from <= now())
    AND (runs_until IS NULL OR runs_until >= now())
  );

-- Advertiser owner can read all of their own
CREATE POLICY "ad_campaigns owner read"
  ON public.ad_campaigns FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.advertisers a
            WHERE a.id = ad_campaigns.advertiser_id
              AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "ad_campaigns owner insert"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.advertisers a
            WHERE a.id = ad_campaigns.advertiser_id
              AND a.owner_id = auth.uid())
  );

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

CREATE POLICY "ad_campaigns owner or admin delete"
  ON public.ad_campaigns FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.advertisers a
            WHERE a.id = ad_campaigns.advertiser_id
              AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

-- Events (impressions & clicks)
CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  kind text NOT NULL, -- impression|click
  surface text,       -- where it rendered (e.g. portal_home, nearby_rail)
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ad_events_campaign_idx ON public.ad_events(campaign_id);
CREATE INDEX ad_events_created_idx ON public.ad_events(created_at);

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

-- Anyone may record an event (kind validated client-side; cheap and bounded)
CREATE POLICY "ad_events anyone insert"
  ON public.ad_events FOR INSERT
  WITH CHECK (kind IN ('impression','click'));

-- Owner of the advertiser or admin can read events
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

-- updated_at triggers
CREATE TRIGGER advertisers_touch BEFORE UPDATE ON public.advertisers
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();
CREATE TRIGGER ad_campaigns_touch BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();
