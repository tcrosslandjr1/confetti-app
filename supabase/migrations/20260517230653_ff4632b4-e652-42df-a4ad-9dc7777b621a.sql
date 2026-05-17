CREATE TABLE public.vendor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  legal_name TEXT,
  display_name TEXT,
  tagline TEXT,
  description TEXT,
  website_url TEXT,
  support_email TEXT,
  support_phone TEXT,
  logo_url TEXT,
  banner_url TEXT,
  brand_color TEXT,
  accent_color TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  address JSONB,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX idx_vendor_profiles_vendor_id ON public.vendor_profiles(vendor_id);
CREATE INDEX idx_vendor_profiles_published ON public.vendor_profiles(is_published) WHERE is_published = true;

ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published vendor profiles are viewable by everyone"
ON public.vendor_profiles FOR SELECT
USING (is_published = true);

CREATE POLICY "Owners can view their own vendor profile"
ON public.vendor_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert their own vendor profile"
ON public.vendor_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their own vendor profile"
ON public.vendor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their own vendor profile"
ON public.vendor_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendor profiles"
ON public.vendor_profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vendor_profiles_updated_at
BEFORE UPDATE ON public.vendor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();