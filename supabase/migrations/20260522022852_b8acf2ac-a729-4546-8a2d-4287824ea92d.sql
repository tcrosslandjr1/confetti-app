
-- Public crew board for boarding passes, keyed by share token in the URL
CREATE TABLE public.boarding_pass_crew (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token text NOT NULL,
  name text NOT NULL,
  rsvp text NOT NULL DEFAULT 'Going',
  status text NOT NULL DEFAULT 'Getting Ready',
  travel text NOT NULL DEFAULT 'Not picked',
  eta text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX boarding_pass_crew_token_idx ON public.boarding_pass_crew(share_token);

ALTER TABLE public.boarding_pass_crew ENABLE ROW LEVEL SECURITY;

-- Anyone with the link can read crew for that token
CREATE POLICY "Anyone can read crew by token"
  ON public.boarding_pass_crew FOR SELECT
  USING (true);

-- Anyone can join the crew (insert) — token acts as the shared secret
CREATE POLICY "Anyone can join crew"
  ON public.boarding_pass_crew FOR INSERT
  WITH CHECK (length(share_token) >= 8 AND length(name) BETWEEN 1 AND 60);

-- Anyone can update their row's status fields (collaborative board)
CREATE POLICY "Anyone can update crew status"
  ON public.boarding_pass_crew FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER touch_boarding_pass_crew_updated_at
  BEFORE UPDATE ON public.boarding_pass_crew
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.boarding_pass_crew;
