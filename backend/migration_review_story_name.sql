-- ============================================================
-- STICKOVER — Add a name to each Review Story
-- Run this AFTER migration_review_stories.sql (safe to re-run)
-- Every story now needs a short name (shown under the circle bubble on
-- the public /reviews page, like an Instagram Highlight name).
-- ============================================================

ALTER TABLE review_stories ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '' AFTER image;
