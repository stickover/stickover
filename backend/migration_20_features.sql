-- ============================================================
-- STICKOVER — Migration for 20 new features
-- Run this AFTER schema.sql (via phpMyAdmin -> Import, or mysql CLI)
-- Safe to re-run (IF NOT EXISTS / try-catch style guards)
-- ============================================================

-- 1) FAQs (FAQSection)
CREATE TABLE IF NOT EXISTS faqs (
  id            VARCHAR(64) PRIMARY KEY,
  question      VARCHAR(500) NOT NULL,
  answer        TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_visible    TINYINT(1) DEFAULT 1
);

-- 2) Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Product reviews (individual reviews; products.rating/reviews_count stay as aggregate cache)
CREATE TABLE IF NOT EXISTS product_reviews (
  id          VARCHAR(64) PRIMARY KEY,
  product_id  VARCHAR(64) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  rating      TINYINT NOT NULL DEFAULT 5,
  comment     TEXT,
  image       TEXT,
  is_approved TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 4) OurSnaps (Instagram-style customer photo gallery)
CREATE TABLE IF NOT EXISTS our_snaps (
  id            VARCHAR(64) PRIMARY KEY,
  image_url     TEXT NOT NULL,
  caption       VARCHAR(255),
  instagram_url VARCHAR(255),
  product_id    VARCHAR(64),
  display_order INT DEFAULT 0,
  is_visible    TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 5) Live visitor tracking (LiveDashboard: "X viewing / Y sold today")
CREATE TABLE IF NOT EXISTS live_visitors (
  session_id  VARCHAR(128) PRIMARY KEY,
  page        VARCHAR(255),
  last_seen   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6) SEO meta fields per product / collection (feature 12)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500) NULL;

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500) NULL;

-- default FAQs (edit anytime from Admin > FAQs)
INSERT IGNORE INTO faqs (id, question, answer, display_order) VALUES
  ('faq-1', 'How long does delivery take?', 'Orders are usually delivered within 4-7 business days across India.', 1),
  ('faq-2', 'Do you offer Cash on Delivery?', 'Yes, all orders currently support Cash on Delivery (COD).', 2),
  ('faq-3', 'Can I return or exchange my order?', 'Yes, please check our Returns & Exchange policy page for details.', 3);

-- ============================================================
-- Order notification support (admin bell / unread badge)
-- Safe to re-run: guarded with IF NOT EXISTS checks below.
-- ============================================================
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'is_seen'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE orders ADD COLUMN is_seen TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- mark existing historical orders as already seen so the badge
-- only reflects genuinely new orders going forward
UPDATE orders SET is_seen = 1 WHERE is_seen = 0 AND created_at < NOW() - INTERVAL 1 DAY;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_created_at'
);
SET @sql2 := IF(@idx_exists = 0,
  'CREATE INDEX idx_orders_created_at ON orders (created_at)',
  'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
