-- Adds separate mobile and desktop banner image columns to collections so
-- each collection can show a different hero banner depending on screen size
-- (uploaded separately in Admin -> Collections -> Edit).

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS banner_mobile TEXT NULL,
  ADD COLUMN IF NOT EXISTS banner_desktop TEXT NULL;
