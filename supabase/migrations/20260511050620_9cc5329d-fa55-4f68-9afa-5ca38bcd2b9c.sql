ALTER TABLE public.testimonials
  ADD COLUMN rating smallint;

ALTER TABLE public.testimonials
  ADD CONSTRAINT testimonials_rating_range
  CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5));