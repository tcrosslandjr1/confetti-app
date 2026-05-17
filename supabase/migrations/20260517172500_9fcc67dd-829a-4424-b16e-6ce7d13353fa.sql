ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS claim_status text DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'pending', 'claimed'));

CREATE INDEX IF NOT EXISTS idx_venues_claimed_by ON public.venues(claimed_by);
CREATE INDEX IF NOT EXISTS idx_venues_claim_status ON public.venues(claim_status);

-- Allow profile owners to manage their own venue claims
CREATE POLICY "Users can update their own venue claims"
ON public.venues
FOR UPDATE
USING (claimed_by = auth.uid())
WITH CHECK (claimed_by = auth.uid() OR claim_status IN ('unclaimed', 'pending'));

-- Allow advertisers to view unclaimed venues
CREATE POLICY "Advertisers can view unclaimed venues"
ON public.venues
FOR SELECT
USING (claim_status = 'unclaimed' OR claimed_by = auth.uid());

-- Add RLS for venue claims
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
