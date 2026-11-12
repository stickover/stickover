-- Adds richer detail to the admin "Live Activity" feed: how long a visitor
-- has been on the site (first_seen), and a human-readable label for what
-- they're looking at (page_label — e.g. the product title, "Checkout", etc).
ALTER TABLE live_visitors
  ADD COLUMN IF NOT EXISTS first_seen TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS page_label VARCHAR(255) NULL;

-- Backfill first_seen for any existing rows so duration doesn't show as 0
-- for sessions that were already live before this migration ran.
UPDATE live_visitors SET first_seen = last_seen WHERE first_seen IS NULL;
