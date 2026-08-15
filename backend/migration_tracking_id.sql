-- Adds a tracking_id field to orders, asked from the admin when marking an order "ready_to_ship".
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(100) AFTER status;
