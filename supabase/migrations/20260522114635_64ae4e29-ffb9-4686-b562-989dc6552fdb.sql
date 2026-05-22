CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

GRANT EXECUTE ON FUNCTION extensions.gen_salt(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION extensions.gen_salt(text, integer) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION extensions.crypt(text, text) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.set_admin_pin(_new_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _new_pin IS NULL OR length(_new_pin) < 4 OR length(_new_pin) > 12 THEN
    RAISE EXCEPTION 'invalid pin length';
  END IF;
  UPDATE public.admin_settings
     SET pin_hash = extensions.crypt(_new_pin, extensions.gen_salt('bf'::text, 10)),
         updated_at = now()
   WHERE id = TRUE;
  IF NOT FOUND THEN
    INSERT INTO public.admin_settings (id, pin_hash)
    VALUES (TRUE, extensions.crypt(_new_pin, extensions.gen_salt('bf'::text, 10)));
  END IF;
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_admin_pin(_pin text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  stored TEXT;
BEGIN
  IF _pin IS NULL OR length(_pin) < 4 THEN
    RETURN FALSE;
  END IF;
  SELECT pin_hash INTO stored FROM public.admin_settings WHERE id = TRUE;
  IF stored IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN stored = extensions.crypt(_pin, stored);
END;
$function$;

NOTIFY pgrst, 'reload schema';