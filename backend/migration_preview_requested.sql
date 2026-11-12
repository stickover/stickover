-- Adds a flag that records when a customer clicks the "Request Preview Image"
-- WhatsApp button on the order-confirmed page, so the admin panel can see
-- which orders are waiting on a preview reply without checking WhatsApp.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preview_requested TINYINT(1) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preview_requested_at TIMESTAMP NULL DEFAULT NULL;
