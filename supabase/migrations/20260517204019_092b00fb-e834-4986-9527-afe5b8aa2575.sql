-- Enums
CREATE TYPE public.promoter_status AS ENUM ('pending','approved','suspended','rejected');
CREATE TYPE public.promoter_job_status AS ENUM ('draft','offered','accepted','funded','in_progress','delivered','verified','paid','cancelled','refunded','disputed');
CREATE TYPE public.promoter_submission_status AS ENUM ('pending','approved','rejected','needs_revision');
CREATE TYPE public.promoter_payout_status AS ENUM ('pending','processing','paid','failed','reversed');

-- promoters
CREATE TABLE public.promoters (
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
CREATE INDEX idx_promoters_status ON public.promoters(status);
CREATE INDEX idx_promoters_cities ON public.promoters USING GIN(cities);
CREATE INDEX idx_promoters_niche ON public.promoters USING GIN(niche);

ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promoters public read approved" ON public.promoters
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "promoters self insert" ON public.promoters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "promoters self update" ON public.promoters
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "promoters admin delete" ON public.promoters
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- promoter_jobs
CREATE TABLE public.promoter_jobs (
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
CREATE INDEX idx_promoter_jobs_advertiser ON public.promoter_jobs(advertiser_id);
CREATE INDEX idx_promoter_jobs_promoter ON public.promoter_jobs(promoter_id);
CREATE INDEX idx_promoter_jobs_status ON public.promoter_jobs(status);

ALTER TABLE public.promoter_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promoter_jobs participants read" ON public.promoter_jobs
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = promoter_jobs.advertiser_id AND a.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.promoters p WHERE p.id = promoter_jobs.promoter_id AND p.user_id = auth.uid())
  );
CREATE POLICY "promoter_jobs advertiser insert" ON public.promoter_jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.owner_id = auth.uid())
  );
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
CREATE POLICY "promoter_jobs admin delete" ON public.promoter_jobs
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- promoter_submissions
CREATE TABLE public.promoter_submissions (
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
CREATE INDEX idx_promoter_submissions_job ON public.promoter_submissions(job_id);
CREATE INDEX idx_promoter_submissions_status ON public.promoter_submissions(verification_status);

ALTER TABLE public.promoter_submissions ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "promoter_submissions promoter insert" ON public.promoter_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.promoter_jobs j
      JOIN public.promoters p ON p.id = j.promoter_id
      WHERE j.id = job_id AND p.user_id = auth.uid()
    )
  );
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
CREATE POLICY "promoter_submissions admin delete" ON public.promoter_submissions
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- promoter_payouts
CREATE TABLE public.promoter_payouts (
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
CREATE INDEX idx_promoter_payouts_promoter ON public.promoter_payouts(promoter_id);
CREATE INDEX idx_promoter_payouts_job ON public.promoter_payouts(job_id);

ALTER TABLE public.promoter_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promoter_payouts owner read" ON public.promoter_payouts
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.promoters p WHERE p.id = promoter_payouts.promoter_id AND p.user_id = auth.uid())
  );
CREATE POLICY "promoter_payouts admin write" ON public.promoter_payouts
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- promoter_metrics_daily
CREATE TABLE public.promoter_metrics_daily (
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
CREATE INDEX idx_promoter_metrics_daily_promoter_date ON public.promoter_metrics_daily(promoter_id, date);

ALTER TABLE public.promoter_metrics_daily ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "promoter_metrics_daily admin write" ON public.promoter_metrics_daily
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_promoter_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_promoters_updated BEFORE UPDATE ON public.promoters
  FOR EACH ROW EXECUTE FUNCTION public.touch_promoter_updated_at();
CREATE TRIGGER trg_promoter_jobs_updated BEFORE UPDATE ON public.promoter_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_promoter_updated_at();
CREATE TRIGGER trg_promoter_submissions_updated BEFORE UPDATE ON public.promoter_submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_promoter_updated_at();
CREATE TRIGGER trg_promoter_payouts_updated BEFORE UPDATE ON public.promoter_payouts
  FOR EACH ROW EXECUTE FUNCTION public.touch_promoter_updated_at();
CREATE TRIGGER trg_promoter_metrics_daily_updated BEFORE UPDATE ON public.promoter_metrics_daily
  FOR EACH ROW EXECUTE FUNCTION public.touch_promoter_updated_at();