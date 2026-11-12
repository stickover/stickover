-- Adds separate ordering columns so "Trending Now" and "Best Sell" sections on the
-- home page can each be rearranged independently in the admin panel, without
-- clashing with the per-collection display_order that already exists.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS trending_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_seller_order INT DEFAULT 0;
