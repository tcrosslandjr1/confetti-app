
CREATE TABLE IF NOT EXISTS public.venue_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid,
  proposed_name text,
  proposed_place_id text,
  proposed_city text,
  proposed_website text,
  user_id uuid NOT NULL,
  method text NOT NULL,
  evidence_handle text,
  evidence_url text,
  evidence_email text,
  evidence_domain text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
