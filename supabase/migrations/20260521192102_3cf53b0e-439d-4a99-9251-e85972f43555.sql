
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. admin_pins table
CREATE TABLE IF NOT EXISTS public.admin_pins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_pins ENABLE ROW LEVEL SECURITY;

-- No direct access policies — only SECURITY DEFINER functions touch this table.
CREATE POLICY "no direct read" ON public.admin_pins FOR SELECT USING (false);
CREATE POLICY "no direct write" ON public.admin_pins FOR ALL USING (false) WITH CHECK (false);

CREATE TRIGGER admin_pins_set_updated_at
BEFORE UPDATE ON public.admin_pins
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Function: does the current admin already have a pin?
CREATE OR REPLACE FUNCTION public.admin_pin_status()
RETURNS TABLE(has_pin boolean, locked boolean, locked_until timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'not_admin';
  END IF;
  RETURN QUERY
    SELECT (ap.user_id IS NOT NULL),
           (ap.locked_until IS NOT NULL AND ap.locked_until > now()),
           ap.locked_until
    FROM (SELECT uid AS u) x
    LEFT JOIN public.admin_pins ap ON ap.user_id = x.u;
END $$;

-- 3. Function: set or change pin (requires admin)
CREATE OR REPLACE FUNCTION public.set_admin_pin(_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'not_admin';
  END IF;
  IF _pin IS NULL OR _pin !~ '^[0-9]{4,8}$' THEN
    RAISE EXCEPTION 'invalid_pin';
  END IF;
  INSERT INTO public.admin_pins (user_id, pin_hash, failed_attempts, locked_until)
  VALUES (uid, crypt(_pin, gen_salt('bf', 10)), 0, NULL)
  ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = EXCLUDED.pin_hash,
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = now();
END $$;

-- 4. Function: verify pin
CREATE OR REPLACE FUNCTION public.verify_admin_pin(_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  row_rec public.admin_pins%ROWTYPE;
  ok boolean;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'not_admin';
  END IF;
  SELECT * INTO row_rec FROM public.admin_pins WHERE user_id = uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_pin_set';
  END IF;
  IF row_rec.locked_until IS NOT NULL AND row_rec.locked_until > now() THEN
    RAISE EXCEPTION 'locked';
  END IF;
  ok := (row_rec.pin_hash = crypt(_pin, row_rec.pin_hash));
  IF ok THEN
    UPDATE public.admin_pins
      SET failed_attempts = 0, locked_until = NULL, updated_at = now()
      WHERE user_id = uid;
    RETURN true;
  ELSE
    UPDATE public.admin_pins
      SET failed_attempts = failed_attempts + 1,
          locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END,
          updated_at = now()
      WHERE user_id = uid;
    RETURN false;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.admin_pin_status() FROM public;
REVOKE ALL ON FUNCTION public.set_admin_pin(text) FROM public;
REVOKE ALL ON FUNCTION public.verify_admin_pin(text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_pin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(text) TO authenticated;

-- 5. Create the admin user
DO $$
DECLARE
  new_uid uuid;
  existing_uid uuid;
BEGIN
  SELECT id INTO existing_uid FROM auth.users WHERE lower(email) = lower('AdminMU@confetti.com');
  IF existing_uid IS NOT NULL THEN
    new_uid := existing_uid;
    UPDATE auth.users
      SET encrypted_password = crypt('tcrossland09824!', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = existing_uid;
  ELSE
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_uid, 'authenticated', 'authenticated',
      'AdminMU@confetti.com',
      crypt('tcrossland09824!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Admin MU"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, new_uid::text,
      jsonb_build_object('sub', new_uid::text, 'email', 'AdminMU@confetti.com', 'email_verified', true),
      'email', now(), now(), now());
  END IF;

  INSERT INTO public.profiles (id, display_name)
    VALUES (new_uid, 'Admin MU')
    ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
    VALUES (new_uid, 'admin')
    ON CONFLICT DO NOTHING;

  INSERT INTO public.admin_pins (user_id, pin_hash)
    VALUES (new_uid, crypt('236166', gen_salt('bf', 10)))
    ON CONFLICT (user_id) DO UPDATE
      SET pin_hash = EXCLUDED.pin_hash, failed_attempts = 0, locked_until = NULL, updated_at = now();
END $$;
