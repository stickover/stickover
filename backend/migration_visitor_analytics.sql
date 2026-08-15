-- Adds detailed tracking columns to visitor_daily_log so the admin panel's
-- new "Visitors" analytics tab can show, per day/period:
--   - where each visitor landed first that day  (landing_page / landing_page_label)
--   - where they were last seen / left off      (last_page / last_page_label)
--   - what brought them to the site              (traffic_source, e.g. "Google Search", "Instagram", "Direct")
--   - the raw referrer URL, kept for reference   (referrer_raw)
--
-- Safe to run multiple times (IF NOT EXISTS guards), and safe on an existing
-- populated table — old rows simply have these columns as NULL until the
-- next heartbeat from that visitor fills them in.

ALTER TABLE visitor_daily_log
  ADD COLUMN IF NOT EXISTS landing_page VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS landing_page_label VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS last_page VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS last_page_label VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS traffic_source VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS referrer_raw VARCHAR(500) NULL;
