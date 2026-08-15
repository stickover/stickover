-- Stores the full checkout payload (cart items + customer/shipping details)
-- the instant a Razorpay order is created, keyed by razorpay_order_id.
--
-- WHY: the client-side Razorpay `handler` callback (which normally creates
-- the real order + fires the Purchase pixel) can silently never run — most
-- commonly when a customer pays via a UPI app (GPay/PhonePe) and the
-- mobile browser tab gets suspended/reloaded during the app-switch. Payment
-- succeeds on Razorpay's side but the browser never gets to finish the job,
-- so the order — and the Purchase event — are lost even though the
-- customer was charged.
--
-- The /api/payment/webhook route (Razorpay's `payment.captured` webhook)
-- uses this table as a server-side safety net: it looks up the draft by
-- razorpay_order_id and creates the order (idempotently) even if the
-- browser never came back.
CREATE TABLE IF NOT EXISTS checkout_drafts (
  razorpay_order_id VARCHAR(64) PRIMARY KEY,
  payload_json      LONGTEXT NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
