-- FAQ categories: adds a `category` column to the existing faqs table so
-- the storefront can show a category grid (About / Product Customization /
-- Payment / Shipping / Orders / Returns / Coupons) instead of one flat list,
-- and seeds it with phone-case-specific questions. Safe to re-run —
-- INSERT IGNORE keeps the fixed ids from duplicating.

ALTER TABLE faqs ADD COLUMN IF NOT EXISTS category VARCHAR(120) NOT NULL DEFAULT 'About Stickover';

INSERT IGNORE INTO faqs (id, question, answer, category, display_order, is_visible) VALUES
('faq-about-1', 'Who is Stickover and what do you sell?', 'Stickover is a custom phone case and sticker store — we design, print, and ship personalised phone cases (acrylic, glass, gold-finish and more) and custom stickers pan-India.', 'About Stickover', 1, 1),
('faq-about-2', 'Where is Stickover based?', 'We are based in Avinashi, Tiruppur, Tamil Nadu, and we ship orders across India.', 'About Stickover', 2, 1),
('faq-about-3', 'How long has Stickover been making custom cases?', 'We have been crafting customised acrylic and gold phone cases for over 5 years, focused on durability and print quality.', 'About Stickover', 3, 1),
('faq-about-4', 'Does Stickover only make phone cases?', 'Phone cases are our main product, but we also print custom stickers and a few personalised accessories — check our Collections page for the full range.', 'About Stickover', 4, 1),
('faq-about-5', 'How can I stay updated on new designs?', 'Follow us on Instagram or subscribe to our newsletter from the homepage footer — new arrivals are posted there first.', 'About Stickover', 5, 1),

('faq-custom-1', 'What is Product Customization?', 'On customizable products, you can upload your own photo or type a name, and we print it directly onto the case exactly as previewed.', 'Product Customization', 1, 1),
('faq-custom-2', 'What happens if I upload a low quality photo?', 'If the image resolution is too low, the print may look blurry or pixelated. We recommend uploading photos at least 1000x1000px for a sharp result.', 'Product Customization', 2, 1),
('faq-custom-3', 'Will I see a preview before my case is printed?', 'Yes — the customization tool shows a live preview of your photo or name on the case before you add it to cart.', 'Product Customization', 3, 1),
('faq-custom-4', 'Can I customize any phone model?', 'Most of our cases support a wide range of phone models — select your brand and model on the product page to see availability.', 'Product Customization', 4, 1),
('faq-custom-5', 'Can I request a fully custom design not shown on the site?', 'Yes, reach out via Contact Us or WhatsApp with your design idea and we will let you know if it is possible.', 'Product Customization', 5, 1),

('faq-order-1', 'What is the process to place an order?', 'Pick a case, choose your phone model, customize it if needed, add to cart, and checkout with your address and payment details.', 'How to Place Order?', 1, 1),
('faq-order-2', 'How much time will it take to receive my order?', 'Orders are typically dispatched within 2-3 business days and delivered within 5-7 days depending on your location.', 'How to Place Order?', 2, 1),
('faq-order-3', 'Can I add more items to an order I already placed?', 'Once an order is placed it usually starts processing quickly, so please place a new order for additional items or contact us right away.', 'How to Place Order?', 3, 1),
('faq-order-4', 'I cannot track my order — what should I do?', 'Use the Track Order page with your order ID, or contact our support team with your registered phone number.', 'How to Place Order?', 4, 1),
('faq-order-5', 'Do I need an account to place an order?', 'No, you can checkout as a guest, though creating an account makes it easier to track past orders.', 'How to Place Order?', 5, 1),

('faq-pay-1', 'What payment options are available?', 'We accept UPI, credit/debit cards, net banking, and popular wallets via Razorpay, plus Cash on Delivery on eligible pincodes.', 'Payment and Security', 1, 1),
('faq-pay-2', 'Are online transactions secure?', 'Yes, all payments are processed through Razorpay with bank-grade encryption — we never store your card details.', 'Payment and Security', 2, 1),
('faq-pay-3', 'What should I do if a payment fails?', 'If the amount was deducted but the order was not confirmed, it is usually auto-refunded within 5-7 business days. Contact us if it takes longer.', 'Payment and Security', 3, 1),
('faq-pay-4', 'How will I get my refund amount?', 'Refunds are credited back to the original payment method within 5-7 business days after approval.', 'Payment and Security', 4, 1),
('faq-pay-5', 'My bank charged me twice for one order, what should I do?', 'Please share your order ID and payment reference with our support team — we will verify with Razorpay and refund any duplicate charge.', 'Payment and Security', 5, 1),

('faq-ship-1', 'Do you ship all over India?', 'Yes, we deliver pan-India via trusted courier partners.', 'Shipping and Delivery', 1, 1),
('faq-ship-2', 'What are the shipping charges?', 'Shipping is completely free on every order, no matter how small — even a ₹1 order ships free.', 'Shipping and Delivery', 2, 1),
('faq-ship-3', 'Can I change my delivery address after placing the order?', 'If the order has not yet shipped, contact us immediately and we will try to update the address.', 'Shipping and Delivery', 3, 1),
('faq-ship-4', 'What if I am not available when the courier delivers?', 'The courier will usually attempt redelivery 1-2 more times; you can also coordinate a convenient time via the tracking link.', 'Shipping and Delivery', 4, 1),
('faq-ship-5', 'Do you ship internationally?', 'Currently we only ship within India.', 'Shipping and Delivery', 5, 1),

('faq-account-1', 'How do I check my order history?', 'Login and go to My Account / Order History to see all your past and current orders.', 'My Account / Order History', 1, 1),
('faq-account-2', 'I forgot my account password, what do I do?', 'Use the "Forgot Password" link on the login page to reset it via your registered email or phone.', 'My Account / Order History', 2, 1),
('faq-account-3', 'Can I update my saved address or phone number?', 'Yes, edit your details anytime from My Account.', 'My Account / Order History', 3, 1),
('faq-account-4', 'How do I contact support about my order?', 'Use the Contact Us page or WhatsApp button with your order ID and query.', 'My Account / Order History', 4, 1),

('faq-return-1', 'Can I cancel my order any time?', 'Since our products are custom-printed, cancellation is only possible before we start processing — please call us as soon as possible after ordering.', 'Cancellation and Returns', 1, 1),
('faq-return-2', 'Can I get a replacement or refund if there was a design mistake?', 'If the printed design doesn''t match the preview you approved due to our error, we will replace it free of cost.', 'Cancellation and Returns', 2, 1),
('faq-return-3', 'Can I get a replacement if I made a mistake in my own design?', 'Since these are custom products, replacements for customer-side design mistakes (wrong photo, spelling, etc.) are handled case-by-case — contact support quickly after receiving the order.', 'Cancellation and Returns', 3, 1),
('faq-return-4', 'What if there is a quality mismatch with what I received?', 'Share photos of the received product within 48 hours of delivery and we will review it for a replacement or refund.', 'Cancellation and Returns', 4, 1),

('faq-coupon-1', 'How do I apply a coupon code?', 'Enter your coupon code in the cart or checkout page before placing the order to see the discount applied.', 'Coupons and Offers', 1, 1),
('faq-coupon-2', 'Why is my coupon code not working?', 'Check the coupon''s minimum order value and validity — expired or restricted codes will show an error at checkout.', 'Coupons and Offers', 2, 1),
('faq-coupon-3', 'Can I combine multiple coupons on one order?', 'Only one coupon can be applied per order.', 'Coupons and Offers', 3, 1);
