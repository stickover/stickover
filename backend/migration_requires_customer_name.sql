-- Adds the "requires customer name" toggle for products (e.g. name-print phone cases).
-- The existing is_customizable column already covers "requires image from customer".
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS requires_customer_name TINYINT(1) DEFAULT 0 AFTER is_customizable;
