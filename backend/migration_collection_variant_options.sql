-- ============================================================
-- Adds a "Variant Options" dropdown assignment at the COLLECTION level.
-- When set, every product inside that collection shows this dropdown
-- on its product page (unless the product itself has its own override
-- set in Admin > Products, which always wins).
-- Run via hPanel -> Databases -> phpMyAdmin -> Import.
-- ============================================================

ALTER TABLE collections ADD COLUMN IF NOT EXISTS variant_group_id VARCHAR(64) DEFAULT NULL AFTER is_highlighted;
