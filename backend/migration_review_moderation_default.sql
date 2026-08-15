-- Product reviews used to default to is_approved=1 (auto-live). Customer-submitted
-- reviews from the new product-page "Write a Review" form should stay hidden until
-- an admin approves them in the admin panel's Reviews tab.
ALTER TABLE product_reviews MODIFY is_approved TINYINT(1) DEFAULT 0;
