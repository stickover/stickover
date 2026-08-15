-- Adds support for "customizable" products (custom/photo cases) that require
-- the shopper to upload their own photo before adding to cart.
ALTER TABLE products
  ADD COLUMN is_customizable TINYINT(1) DEFAULT 0 AFTER is_best_seller;
