-- Adds:
-- 1) products.material — Acrylic / Gold / Glass / Hard Plastic (drives fixed pricing)
-- 2) collections.is_highlighted — shows a highlight border on the Home page
--    "Shop By Category" grid, used for the Special Collections & Designed Cases groups.

ALTER TABLE products
  ADD COLUMN material VARCHAR(20) NULL AFTER brand;

ALTER TABLE collections
  ADD COLUMN is_highlighted TINYINT(1) DEFAULT 0 AFTER is_visible;
