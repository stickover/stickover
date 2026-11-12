-- Migration: re-add Cash on Delivery (COD) as a payment option, alongside Razorpay.
-- Run this once against an existing stickover database (after migration_razorpay.sql).

ALTER TABLE orders
  MODIFY COLUMN payment_method ENUM('razorpay','cod') DEFAULT 'razorpay';

ALTER TABLE orders
  MODIFY COLUMN payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'paid';
