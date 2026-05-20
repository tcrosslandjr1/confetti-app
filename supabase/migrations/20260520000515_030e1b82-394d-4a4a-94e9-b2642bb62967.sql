UPDATE auth.users
SET email = 'admin@confetti.com',
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{display_name}',
      '"Admin"'::jsonb
    ),
    updated_at = now()
WHERE email = 'admin@demo.local';

UPDATE public.profiles
SET display_name = 'Admin',
    updated_at = now()
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@confetti.com');