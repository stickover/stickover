-- Migration: remove COD, add Razorpay online payment support.
-- Run this once against an existing stickover database.

ALTER TABLE orders
  MODIFY COLUMN payment_method ENUM('razorpay') DEFAULT 'razorpay';

ALTER TABLE orders
  ADD COLUMN payment_status ENUM('paid','failed','refunded') DEFAULT 'paid' AFTER payment_method,
  ADD COLUMN razorpay_order_id   VARCHAR(64) AFTER payment_status,
  ADD COLUMN razorpay_payment_id VARCHAR(64) AFTER razorpay_order_id;

-- Any pre-existing COD orders are historical records only; leave their status as-is.
UPDATE orders SET payment_method = 'razorpay' WHERE payment_method = 'cod';

-- Migration: store Razorpay credentials in the DB (set via Admin Panel)
-- instead of requiring them in .env. Secret is stored as-is in this table
-- which is never exposed to any public/non-admin API response.
CREATE TABLE IF NOT EXISTS payment_credentials (
  id INT PRIMARY KEY DEFAULT 1,
  razorpay_key_id VARCHAR(128) DEFAULT NULL,
  razorpay_key_secret VARCHAR(128) DEFAULT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT IGNORE INTO payment_credentials (id, enabled) VALUES (1, 0);
