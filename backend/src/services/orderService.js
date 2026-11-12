const pool = require("../config/db");

// Order IDs look like STC0001, STC0002, ... STC9999. Once the running count
// reaches 5 digits (10000+) we grow the zero-padding by one extra leading
// zero (STC010000, STC0100000, ...) so the id keeps its "STC000x" shape
// instead of ever shrinking back down to a bare 5-digit number.
function formatOrderNumber(n) {
  const digits = String(n);
  const width = digits.length <= 4 ? 4 : digits.length + 1;
  return "STC" + digits.padStart(width, "0");
}

// Atomically reserves the next order number. Uses a dedicated AUTO_INCREMENT
// table (order_seq) so concurrent checkouts can never land on the same id -
// this must never throw/collide, since a failed id generation would mean a
// customer's order silently fails to place.
async function nextOrderId() {
  const [result] = await pool.query("INSERT INTO order_seq () VALUES ()");
  return formatOrderNumber(result.insertId);
}

// Returns the existing order id for a given razorpay_order_id, or null.
// Used for idempotency so the checkout route and the webhook safety-net
// never create two orders for the same payment.
async function findOrderIdByRazorpayOrderId(razorpayOrderId) {
  if (!razorpayOrderId) return null;
  const [rows] = await pool.query("SELECT id FROM orders WHERE razorpay_order_id = ? LIMIT 1", [razorpayOrderId]);
  return rows[0] ? rows[0].id : null;
}

// Creates the order row. `o` is the same shape the frontend posts to
// POST /api/orders (items, subtotal, shipping, total, customer + shipping
// fields, sessionId). Shared by the normal checkout flow and the Razorpay
// webhook fallback so both paths insert identically and stay idempotent.
async function createOrder(o, { razorpayOrderId, razorpayPaymentId }) {
  const existingId = await findOrderIdByRazorpayOrderId(razorpayOrderId);
  if (existingId) return { id: existingId, alreadyExisted: true };

  const id = await nextOrderId();
  await pool.query(
    `INSERT INTO orders (id, items_json, subtotal, shipping, total, customer_name, customer_email,
      customer_phone, customer_alt_phone, shipping_address, city, state, pincode,
      payment_method, payment_status, razorpay_order_id, razorpay_payment_id, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
    [
      id, JSON.stringify(o.items || []), o.subtotal || 0, o.shipping || 0, o.total || 0,
      o.customerName, o.customerEmail || "", o.customerPhone, o.customerAltPhone || "",
      o.shippingAddress, o.city, o.state, o.pincode,
      "razorpay", "paid", razorpayOrderId, razorpayPaymentId,
    ]
  );
  if (o.sessionId) {
    pool.query("DELETE FROM abandoned_carts WHERE session_id = ?", [o.sessionId]).catch(() => {});
  }
  return { id, alreadyExisted: false };
}

// ── Checkout drafts ──────────────────────────────────────────────────────
// Saved right after /api/payment/create-order succeeds, before the Razorpay
// modal even opens. This is what lets the webhook fallback create the real
// order later even if the customer's browser tab never comes back (common
// with UPI app-switch on mobile) — see migration_checkout_drafts.sql.
async function saveCheckoutDraft(razorpayOrderId, payload) {
  await pool.query(
    `INSERT INTO checkout_drafts (razorpay_order_id, payload_json) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json)`,
    [razorpayOrderId, JSON.stringify(payload)]
  );
}

async function getCheckoutDraft(razorpayOrderId) {
  const [rows] = await pool.query(
    "SELECT payload_json FROM checkout_drafts WHERE razorpay_order_id = ? LIMIT 1",
    [razorpayOrderId]
  );
  if (!rows[0]) return null;
  try {
    return JSON.parse(rows[0].payload_json);
  } catch {
    return null;
  }
}

module.exports = {
  nextOrderId,
  findOrderIdByRazorpayOrderId,
  createOrder,
  saveCheckoutDraft,
  getCheckoutDraft,
};
