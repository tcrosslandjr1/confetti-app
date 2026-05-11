
-- instagram_oauth_states: owner-scoped policies
CREATE POLICY "instagram_oauth_states own select"
  ON public.instagram_oauth_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "instagram_oauth_states own insert"
  ON public.instagram_oauth_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "instagram_oauth_states own update"
  ON public.instagram_oauth_states FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "instagram_oauth_states own delete"
  ON public.instagram_oauth_states FOR DELETE
  USING (auth.uid() = user_id);

-- tiktok_oauth_states: owner-scoped policies
CREATE POLICY "tiktok_oauth_states own select"
  ON public.tiktok_oauth_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tiktok_oauth_states own insert"
  ON public.tiktok_oauth_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tiktok_oauth_states own update"
  ON public.tiktok_oauth_states FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tiktok_oauth_states own delete"
  ON public.tiktok_oauth_states FOR DELETE
  USING (auth.uid() = user_id);
