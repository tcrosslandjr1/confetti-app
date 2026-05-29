-- ============================================================
-- Outing Tags Mapping
--
-- Maps social_venue_signals.category (16 venue types) to
-- Confetti's 95-category outing taxonomy so the Recommendation
-- Agent and Discovery UI can query by mood/outing type.
--
-- Example: WHERE 'Girls Night' = ANY(outing_tags)
-- ============================================================

-- 1. Add outing_tags column
ALTER TABLE social_venue_signals
  ADD COLUMN IF NOT EXISTS outing_tags text[] DEFAULT '{}';

-- 2. Mapping function: venue category → outing categories
CREATE OR REPLACE FUNCTION venue_category_to_outing_tags(cat text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE cat
    WHEN 'Rooftops' THEN ARRAY[
      'Rooftop Night', 'Soft Life Night', 'Luxury Dinner Night',
      'Couples Night', 'Girls Night', 'VIP Night', 'Group Night Out',
      'Birthday Night', 'Anniversary Night', 'Lounge Night'
    ]
    WHEN 'Brunch' THEN ARRAY[
      'Brunch Night', 'Girls Night', 'Couples Night', 'Double Date',
      'Birthday Night', 'Bachelorette Party', 'Best Friends Night',
      'Reunion Night', 'Group Night Out', 'Solo Night Out'
    ]
    WHEN 'Nightlife' THEN ARRAY[
      'Turn-Up Night', 'Club Night', 'Bar Hop', 'Group Night Out',
      'Birthday Night', 'Bachelor Party', 'Bachelorette Party',
      'Graduation Night', 'Bottle Service Night', 'After-Hours Night'
    ]
    WHEN 'Cocktails' THEN ARRAY[
      'Chill Night', 'Couples Night', 'Girls Night', 'Bar Hop',
      'Lounge Night', 'Best Friends Night', 'Double Date',
      'Speakeasy Night', 'Group Night Out'
    ]
    WHEN 'Speakeasy' THEN ARRAY[
      'Chill Night', 'Couples Night', 'Mystery Night', 'Girls Night',
      'Soft Life Night', 'Custom Vibe Night', 'Double Date',
      'Anniversary Night', 'Best Friends Night'
    ]
    WHEN 'Live Music' THEN ARRAY[
      'Live Music Night', 'Couples Night', 'Girls Night', 'Group Night Out',
      'Birthday Night', 'Cultural Festival Night', 'Date Night',
      'Best Friends Night', 'Reunion Night'
    ]
    WHEN 'Jazz' THEN ARRAY[
      'Jazz Night', 'Couples Night', 'Girls Night', 'Soft Life Night',
      'Anniversary Night', 'Dinner Night', 'Chill Night',
      'Best Friends Night', 'Double Date'
    ]
    WHEN 'Wine Bar' THEN ARRAY[
      'Wine Night', 'Girls Night', 'Soft Life Night', 'Couples Night',
      'Chill Night', 'Best Friends Night', 'Double Date',
      'Anniversary Night', 'Solo Night Out'
    ]
    WHEN 'Café' THEN ARRAY[
      'Coffee Night', 'Solo Night Out', 'Chill Night', 'Best Friends Night',
      'Girls Night', 'Scenic Walk Night', 'Waterfront Chill Night',
      'Custom Vibe Night'
    ]
    WHEN 'Fine Dining' THEN ARRAY[
      'Fine Dining Night', 'Luxury Dinner Night', 'Anniversary Night',
      'Couples Night', 'VIP Night', 'Tasting Menu Night', 'Birthday Night',
      'Soft Life Night', 'Double Date', 'In-Laws Night'
    ]
    WHEN 'Happy Hour' THEN ARRAY[
      'Chill Night', 'Coworker Night', 'Bar Hop', 'Girls Night',
      'Best Friends Night', 'Group Night Out', 'Guys Night',
      'Dive Bar Crawl', 'Solo Night Out'
    ]
    WHEN 'Late Night' THEN ARRAY[
      'After-Hours Night', 'Bar Hop', 'Turn-Up Night', 'Group Night Out',
      'Dive Bar Crawl', 'Club Night', 'Birthday Night'
    ]
    WHEN 'Dining' THEN ARRAY[
      'Dinner Night', 'Couples Night', 'Family Night', 'Birthday Night',
      'Group Night Out', 'Best Friends Night', 'Double Date',
      'Anniversary Night', 'In-Laws Night', 'Reunion Night'
    ]
    WHEN 'Experience' THEN ARRAY[
      'Pop-Up Event Night', 'Surprise Me Night', 'Mystery Night',
      'Build-Your-Own Night', 'Couples Night', 'Birthday Night',
      'Group Night Out', 'Girls Night', 'Hybrid Night'
    ]
    WHEN 'Pop-Up' THEN ARRAY[
      'Pop-Up Event Night', 'Surprise Me Night', 'Market Night',
      'Shopping Night', 'Cultural Festival Night', 'Girls Night',
      'Best Friends Night', 'Thrifting Night'
    ]
    WHEN 'Seafood' THEN ARRAY[
      'Seafood Night', 'Dinner Night', 'Couples Night', 'Fine Dining Night',
      'Waterfront Chill Night', 'Anniversary Night', 'Birthday Night',
      'Family Night'
    ]
    ELSE ARRAY[]::text[]
  END
$$;

-- 3. Backfill all existing rows
UPDATE social_venue_signals
SET outing_tags = venue_category_to_outing_tags(category)
WHERE category IS NOT NULL;

-- 4. Trigger to auto-populate outing_tags on future upserts
CREATE OR REPLACE FUNCTION set_outing_tags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.outing_tags := venue_category_to_outing_tags(NEW.category);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_outing_tags ON social_venue_signals;
CREATE TRIGGER trg_set_outing_tags
  BEFORE INSERT OR UPDATE OF category
  ON social_venue_signals
  FOR EACH ROW
  EXECUTE FUNCTION set_outing_tags();

-- 5. Index for fast outing-based queries
CREATE INDEX IF NOT EXISTS idx_venue_signals_outing_tags
  ON social_venue_signals USING gin (outing_tags);

CREATE INDEX IF NOT EXISTS idx_venue_signals_city_outing
  ON social_venue_signals (city_slug) INCLUDE (outing_tags, venue_name, category, engagement_score);
