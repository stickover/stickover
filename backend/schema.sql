-- ============================================================
-- STICKOVER.IN — MySQL schema (Hostinger)
-- Import this via hPanel -> Databases -> phpMyAdmin -> Import
-- ============================================================

CREATE TABLE IF NOT EXISTS collections (
  id            VARCHAR(64) PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL UNIQUE,
  image         TEXT,
  banner_mobile TEXT,
  banner_desktop TEXT,
  banner_media_type VARCHAR(10) DEFAULT 'image',
  banner_video_url TEXT,
  description   TEXT,
  is_visible    TINYINT(1) DEFAULT 1,
  is_highlighted TINYINT(1) DEFAULT 0,
  variant_group_id VARCHAR(64) DEFAULT NULL, -- collection-wide "Variant Options" dropdown (see store_settings.variantGroups); products can override this individually
  display_order INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subcollections (
  id            VARCHAR(64) PRIMARY KEY,
  collection_id VARCHAR(64) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  image         TEXT,
  display_order INT DEFAULT 0,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id               VARCHAR(64) PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  price            DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_price    DECIMAL(10,2) DEFAULT 0,
  discount         INT DEFAULT 0,
  description      TEXT,
  brand            VARCHAR(100),
  material         VARCHAR(20),
  collection_id    VARCHAR(64),
  tags             TEXT,               -- JSON array as text
  stock_status     ENUM('in_stock','low_stock','out_of_stock') DEFAULT 'in_stock',
  is_featured      TINYINT(1) DEFAULT 0,
  is_trending      TINYINT(1) DEFAULT 0,
  is_new_arrival   TINYINT(1) DEFAULT 0,
  is_best_seller   TINYINT(1) DEFAULT 0,
  is_customizable  TINYINT(1) DEFAULT 0,
  requires_customer_name TINYINT(1) DEFAULT 0,
  images           TEXT,               -- JSON array of image URLs (/uploads/xxx.jpg)
  models           TEXT,               -- JSON array of compatible phone models
  variant_group_id VARCHAR(64) DEFAULT NULL, -- assigned "Variant Options" dropdown group (see store_settings.variantGroups)
  rating           DECIMAL(2,1) DEFAULT 5.0,
  reviews_count    INT DEFAULT 0,
  display_order    INT DEFAULT 0,
  trending_order    INT DEFAULT 0,
  best_seller_order INT DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL
);

-- product <-> multiple collections (mirrors old collectionIds[])
CREATE TABLE IF NOT EXISTS product_collections (
  product_id    VARCHAR(64) NOT NULL,
  collection_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (product_id, collection_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS banners (
  id              VARCHAR(64) PRIMARY KEY,
  title           VARCHAR(255),
  subtitle        VARCHAR(255),
  badge           VARCHAR(100),
  image_url       TEXT,
  mobile_image_url TEXT,
  media_type      VARCHAR(10) DEFAULT 'image',
  video_url       TEXT,
  link            VARCHAR(255),
  active          TINYINT(1) DEFAULT 1,
  display_order   INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id                VARCHAR(64) PRIMARY KEY,
  items_json        TEXT NOT NULL,     -- JSON snapshot of cart items
  subtotal          DECIMAL(10,2) NOT NULL,
  shipping          DECIMAL(10,2) DEFAULT 0,
  total             DECIMAL(10,2) NOT NULL,
  customer_name     VARCHAR(255),
  customer_email    VARCHAR(255),
  customer_phone    VARCHAR(20),
  customer_alt_phone VARCHAR(20),
  shipping_address  TEXT,
  city              VARCHAR(100),
  state             VARCHAR(100),
  pincode           VARCHAR(10),
  payment_method    ENUM('razorpay','cod') DEFAULT 'razorpay',
  payment_status    ENUM('pending','paid','failed','refunded') DEFAULT 'paid',
  razorpay_order_id   VARCHAR(64),
  razorpay_payment_id VARCHAR(64),
  status            ENUM('pending','processing','ready_to_ship','shipped','out_for_delivery','delivered','cancelled','returned') DEFAULT 'pending',
  tracking_id       VARCHAR(100),
  preview_requested TINYINT(1) DEFAULT 0,
  preview_requested_at TIMESTAMP NULL DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Atomic counter behind the "STC0001" style order ids (see migration_order_sequence.sql)
CREATE TABLE IF NOT EXISTS order_seq (
  n BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  settings_json LONGTEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);

-- default empty settings row
INSERT IGNORE INTO store_settings (id, settings_json) VALUES (1, JSON_OBJECT());

-- Razorpay credentials, set via Admin Panel -> Settings -> Payment. Never
-- exposed on any public API response (only razorpay_key_id + enabled are,
-- since key_id is safe to expose client-side; key_secret never leaves this table).
CREATE TABLE IF NOT EXISTS site_reviews (
  id          VARCHAR(64) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  rating      TINYINT NOT NULL DEFAULT 5,
  comment     TEXT,
  image       TEXT,
  is_approved TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_credentials (
  id INT PRIMARY KEY DEFAULT 1,
  razorpay_key_id VARCHAR(128) DEFAULT NULL,
  razorpay_key_secret VARCHAR(128) DEFAULT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT IGNORE INTO payment_credentials (id, enabled) VALUES (1, 0);
