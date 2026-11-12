-- ============================================================
-- STICKOVER — Add photo support to per-product reviews
-- Run this AFTER migration_20_features.sql (safe to re-run)
-- Lets a customer attach a photo when reviewing a specific product,
-- same as the general "site reviews" (/reviews page) already allow.
-- ============================================================

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS image TEXT AFTER comment;
