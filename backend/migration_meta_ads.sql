-- Migration: Meta Pixel + Conversions API (CAPI) + Ads Insights dashboard.
-- Run this once against an existing stickover database (phpMyAdmin -> SQL tab).
--
-- Credentials are entered from Admin Panel -> Settings -> Meta Ads (no .env
-- needed, no code redeploy needed to rotate a token). access_token is never
-- returned by any public/non-admin API response.

CREATE TABLE IF NOT EXISTS meta_credentials (
  id INT PRIMARY KEY DEFAULT 1,
  pixel_id VARCHAR(64) DEFAULT NULL,
  access_token TEXT DEFAULT NULL,
  ad_account_id VARCHAR(64) DEFAULT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT IGNORE INTO meta_credentials (id, enabled) VALUES (1, 0);
