-- Adds video-banner support to the banners table so the admin can upload a
-- looping video (instead of a static image) for the home page hero banner.
-- media_type is 'image' (default, existing behaviour) or 'video'.
-- video_url stores the uploaded video's path (same /uploads/ folder as images).

ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS video_url TEXT NULL;
