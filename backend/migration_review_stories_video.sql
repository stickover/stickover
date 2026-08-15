-- Adds video-story support to the review_stories table so the admin can
-- attach a short video (with audio) as a story's full-screen content,
-- instead of only a static image.
-- media_type is 'image' (default, existing behaviour) or 'video'.
-- video stores the uploaded video's path (same /uploads/ folder as images).
-- The existing `image` column always stays the small circular thumbnail
-- shown before a story is opened.

ALTER TABLE review_stories
  ADD COLUMN IF NOT EXISTS video TEXT NULL,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image';
