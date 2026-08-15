-- Adds a dedicated "brand" column to products (e.g. "Apple", "Samsung")
-- so Admin Panel can show Brand and Phone Model as two separate fields.
-- Existing `models` column (compatible phone models) is untouched.

ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100) NULL AFTER description;
