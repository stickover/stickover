-- Adds video-banner support to the collections table so each collection's
-- own page banner can be a looping video instead of a static image, same
-- as the home page Hero banner (see migration_banner_video.sql).
-- banner_media_type is 'image' (default, existing behaviour) or 'video'.
-- banner_video_url stores the uploaded video's path (same /uploads/ folder as images).

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS banner_media_type VARCHAR(10) DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS banner_video_url TEXT NULL;
