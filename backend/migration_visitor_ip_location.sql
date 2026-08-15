-- Adds IP address + geolocation (city/region/country) to the live visitors
-- table, so the admin "Live Activity" panel can show where each visitor is
-- browsing from, not just which page. Safe to re-run.

ALTER TABLE live_visitors
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS region VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS country VARCHAR(120) NULL;
