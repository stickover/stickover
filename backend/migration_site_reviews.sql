-- Public "Write a Review" submissions for the storefront's /reviews page
-- (site-wide reviews, not tied to a specific product). Every submission
-- lands with is_approved=0 and only shows up on the live site once an admin
-- approves it from Admin -> Website Content -> Reviews Approval Queue.

CREATE TABLE IF NOT EXISTS site_reviews (
  id          VARCHAR(64) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  rating      TINYINT NOT NULL DEFAULT 5,
  comment     TEXT,
  image       TEXT,
  is_approved TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
