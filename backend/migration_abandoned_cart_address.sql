-- Captures the rest of the checkout form (not just name/phone/email/city)
-- so the admin's abandoned-cart / live-visitor view shows the maximum
-- information a customer typed in before leaving.
ALTER TABLE abandoned_carts
  ADD COLUMN IF NOT EXISTS customer_alt_phone VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS shipping_address VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS apartment VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS state VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(16) NULL;
