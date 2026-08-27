-- Partner/advertiser lead capture for the /new/advertise page.
-- The old page rendered uncontrolled inputs and discarded submissions.
CREATE TABLE IF NOT EXISTS public.partner_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  city text,
  instagram text,
  contact_email text NOT NULL,
  interested_tier text,
  source text NOT NULL DEFAULT 'advertise_page',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;

-- Anyone may submit a lead; nobody but service role may read/modify them.
-- (city_waitlist got this wrong — anon could SELECT and UPDATE. Don't repeat it.)
CREATE POLICY "partner_leads_insert" ON public.partner_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);
