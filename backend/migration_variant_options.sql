-- ============================================================
-- Variant Options feature
-- Adds a per-product "extra dropdown" (e.g. Charger Type, Ring
-- Light, etc.) shown next to the phone model dropdown on the
-- product page. Groups + their option lists are managed in
-- Admin -> Variant Options and stored in store_settings (like
-- Phone Models). This migration only adds the one column needed
-- to assign a group to a product.
-- Run this via hPanel -> Databases -> phpMyAdmin -> Import.
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variant_group_id VARCHAR(64) DEFAULT NULL AFTER models;
