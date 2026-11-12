-- ============================================================
-- Product Type feature
-- Lets admin mark a product as either a "Phone Case" (shows the phone
-- model dropdown on the product page) or an "Other Product" (no phone
-- model dropdown). Existing products default to 'phone_case', so nothing
-- changes for them.
-- Run via hPanel -> Databases -> phpMyAdmin -> Import.
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) NOT NULL DEFAULT 'phone_case' AFTER title;
