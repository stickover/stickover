-- ============================================================
-- STICKOVER — Review Stories ("Instagram Highlights" style)
-- Run this AFTER schema.sql (safe to re-run)
-- Admin posts a screenshot/photo "story" from the Reviews tab; customers
-- see a row of circular story bubbles at the top of the public /reviews
-- page and can tap through them like Instagram Stories/Highlights.
-- ============================================================

CREATE TABLE IF NOT EXISTS review_stories (
  id            VARCHAR(64) PRIMARY KEY,
  image         TEXT NOT NULL,
  name          VARCHAR(255) NOT NULL DEFAULT '',
  caption       VARCHAR(255),
  display_order INT DEFAULT 0,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
