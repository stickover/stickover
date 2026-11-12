-- ============================================================
-- Sets the same default description on every existing product.
-- Run this once via hPanel -> phpMyAdmin -> SQL (or mysql CLI).
-- New products created after this will get the same text automatically
-- from the backend (see DEFAULT_PRODUCT_DESCRIPTION in products.js).
-- ============================================================

UPDATE products
SET description = 'Protect your phone with confidence using our Premium Mobile Case, crafted from high-quality materials for long-lasting durability. Designed with reinforced edge protection, it absorbs shocks and helps safeguard your device from accidental drops and impacts. The precise fit ensures easy access to all buttons and ports while maintaining a sleek, stylish look. Its anti-slip grip offers comfortable handling and added security in everyday use. Built for both protection and elegance, this case keeps your phone safe without compromising on style.';
