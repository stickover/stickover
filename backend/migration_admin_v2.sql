-- ============================================================
-- STICKOVER — Migration v2: Admin panel parity
-- (live-visitor cart count + abandoned cart capture)
-- Safe to re-run.
-- ============================================================

ALTER TABLE live_visitors
  ADD COLUMN IF NOT EXISTS cart_count INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS abandoned_carts (
  session_id     VARCHAR(128) PRIMARY KEY,
  customer_name  VARCHAR(255),
  customer_phone VARCHAR(32),
  customer_email VARCHAR(255),
  city           VARCHAR(120),
  items_json     TEXT,
  total          DECIMAL(10,2) DEFAULT 0,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
