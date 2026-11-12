-- Atomic counter backing the human-friendly "STC0001" style order IDs.
-- A plain AUTO_INCREMENT table gives us a race-safe, gap-free-enough counter
-- (two orders placed at the exact same millisecond can never collide, unlike
-- a Date.now()-based id) without needing SELECT ... FOR UPDATE locking.
CREATE TABLE IF NOT EXISTS order_seq (
  n BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
