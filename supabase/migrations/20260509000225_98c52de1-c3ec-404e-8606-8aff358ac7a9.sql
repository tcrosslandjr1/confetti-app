
-- Pin search_path on gen_referral_code
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN result;
END $$;

-- Revoke EXECUTE on helpers that should only run inside triggers
REVOKE ALL ON FUNCTION public.gen_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_profile_referral() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_referral_on_booking() FROM PUBLIC, anon, authenticated;
