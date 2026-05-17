-- =====================================================================
-- Corporate Portal schema: companies, teams, policies, outings
-- =====================================================================

-- Roles enum (company-level + team-level reuse)
DO $$ BEGIN
  CREATE TYPE public.corporate_member_role AS ENUM ('owner','admin','manager','member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.corporate_outing_status AS ENUM ('draft','pending_approval','approved','booked','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- companies
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.corporate_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  domain text,
  billing_email text,
  logo_url text,
  plan_tier text NOT NULL DEFAULT 'starter',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_companies_owner_idx ON public.corporate_companies(owner_id);

-- =====================================================================
-- company members
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.corporate_company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.corporate_companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.corporate_member_role NOT NULL DEFAULT 'member',
  invited_email text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS corp_company_members_user_idx ON public.corporate_company_members(user_id);
CREATE INDEX IF NOT EXISTS corp_company_members_company_idx ON public.corporate_company_members(company_id);

-- =====================================================================
-- teams
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.corporate_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.corporate_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  city text,
  manager_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_teams_company_idx ON public.corporate_teams(company_id);

-- =====================================================================
-- team members
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.corporate_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.corporate_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.corporate_member_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS corp_team_members_user_idx ON public.corporate_team_members(user_id);

-- =====================================================================
-- policies (spending + venue rules)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.corporate_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.corporate_companies(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.corporate_teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  per_person_budget_cents integer NOT NULL DEFAULT 0,
  max_headcount integer,
  allowed_categories text[] NOT NULL DEFAULT '{}',
  blocked_categories text[] NOT NULL DEFAULT '{}',
  allowed_cities text[] NOT NULL DEFAULT '{}',
  alcohol_allowed boolean NOT NULL DEFAULT true,
  approval_threshold_cents integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_policies_company_idx ON public.corporate_policies(company_id);

-- =====================================================================
-- outings (planned company events that may convert into corporate_events)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.corporate_outings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.corporate_companies(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.corporate_teams(id) ON DELETE SET NULL,
  policy_id uuid REFERENCES public.corporate_policies(id) ON DELETE SET NULL,
  itinerary_id uuid,
  corporate_event_id uuid REFERENCES public.corporate_events(id) ON DELETE SET NULL,
  title text NOT NULL,
  purpose text NOT NULL DEFAULT 'team-outing',
  status public.corporate_outing_status NOT NULL DEFAULT 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  city text,
  headcount integer NOT NULL DEFAULT 1,
  budget_per_person_cents integer NOT NULL DEFAULT 0,
  total_budget_cents integer NOT NULL DEFAULT 0,
  approved_by uuid,
  approved_at timestamptz,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_outings_company_idx ON public.corporate_outings(company_id);
CREATE INDEX IF NOT EXISTS corp_outings_team_idx ON public.corporate_outings(team_id);
CREATE INDEX IF NOT EXISTS corp_outings_status_idx ON public.corporate_outings(status);

-- =====================================================================
-- updated_at triggers (reuse existing helper)
-- =====================================================================
CREATE TRIGGER corp_companies_touch BEFORE UPDATE ON public.corporate_companies
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();
CREATE TRIGGER corp_teams_touch BEFORE UPDATE ON public.corporate_teams
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();
CREATE TRIGGER corp_policies_touch BEFORE UPDATE ON public.corporate_policies
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();
CREATE TRIGGER corp_outings_touch BEFORE UPDATE ON public.corporate_outings
  FOR EACH ROW EXECUTE FUNCTION public.touch_itineraries_updated_at();

-- =====================================================================
-- Security definer helpers (avoid recursive RLS)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_corp_member(_user uuid, _company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.corporate_company_members
    WHERE company_id = _company AND user_id = _user
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_corp_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_corp_member(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_corp_admin(_user uuid, _company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.corporate_company_members
    WHERE company_id = _company AND user_id = _user AND role IN ('owner','admin')
  ) OR EXISTS (
    SELECT 1 FROM public.corporate_companies WHERE id = _company AND owner_id = _user
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_corp_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_corp_admin(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_corp_team_manager(_user uuid, _team uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.corporate_teams t
    WHERE t.id = _team AND (t.manager_id = _user OR public.is_corp_admin(_user, t.company_id))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_corp_team_manager(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_corp_team_manager(uuid, uuid) TO authenticated;

-- =====================================================================
-- RLS
-- =====================================================================
ALTER TABLE public.corporate_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_outings ENABLE ROW LEVEL SECURITY;

-- companies
CREATE POLICY "corp_companies member read" ON public.corporate_companies
  FOR SELECT USING (
    owner_id = auth.uid()
    OR public.is_corp_member(auth.uid(), id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "corp_companies owner insert" ON public.corporate_companies
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "corp_companies admin update" ON public.corporate_companies
  FOR UPDATE USING (public.is_corp_admin(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_corp_admin(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "corp_companies owner delete" ON public.corporate_companies
  FOR DELETE USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- company members
CREATE POLICY "corp_members read" ON public.corporate_company_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_corp_member(auth.uid(), company_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "corp_members admin manage" ON public.corporate_company_members
  FOR ALL USING (public.is_corp_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_corp_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- teams
CREATE POLICY "corp_teams member read" ON public.corporate_teams
  FOR SELECT USING (
    public.is_corp_member(auth.uid(), company_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "corp_teams admin manage" ON public.corporate_teams
  FOR ALL USING (public.is_corp_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_corp_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- team members
CREATE POLICY "corp_team_members read" ON public.corporate_team_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_corp_team_manager(auth.uid(), team_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "corp_team_members manager manage" ON public.corporate_team_members
  FOR ALL USING (public.is_corp_team_manager(auth.uid(), team_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_corp_team_manager(auth.uid(), team_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- policies
CREATE POLICY "corp_policies member read" ON public.corporate_policies
  FOR SELECT USING (
    public.is_corp_member(auth.uid(), company_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "corp_policies admin manage" ON public.corporate_policies
  FOR ALL USING (public.is_corp_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_corp_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- outings
CREATE POLICY "corp_outings member read" ON public.corporate_outings
  FOR SELECT USING (
    created_by = auth.uid()
    OR public.is_corp_member(auth.uid(), company_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "corp_outings member insert" ON public.corporate_outings
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND public.is_corp_member(auth.uid(), company_id)
  );
CREATE POLICY "corp_outings author or admin update" ON public.corporate_outings
  FOR UPDATE USING (
    created_by = auth.uid()
    OR public.is_corp_admin(auth.uid(), company_id)
    OR (team_id IS NOT NULL AND public.is_corp_team_manager(auth.uid(), team_id))
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_corp_admin(auth.uid(), company_id)
    OR (team_id IS NOT NULL AND public.is_corp_team_manager(auth.uid(), team_id))
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "corp_outings admin delete" ON public.corporate_outings
  FOR DELETE USING (
    public.is_corp_admin(auth.uid(), company_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );