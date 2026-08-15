const express = require("express");
const pool = require("../config/db");
const { requireAdmin } = require("../middleware/auth");
const { verifyRazorpaySignature } = require("./payment");
const { createOrder, saveCheckoutDraft } = require("../services/orderService");

const router = express.Router();

function rowToOrder(r) {
  return {
    id: r.id,
    items: JSON.parse(r.items_json || "[]"),
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    total: Number(r.total),
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    customerAltPhone: r.customer_alt_phone,
    shippingAddress: r.shipping_address,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    razorpayOrderId: r.razorpay_order_id,
    razorpayPaymentId: r.razorpay_payment_id,
    status: r.status,
    trackingId: r.tracking_id || "",
    previewRequested: !!r.preview_requested,
    previewRequestedAt: r.preview_requested_at,
    isSeen: !!r.is_seen,
    createdAt: r.created_at,
  };
}

// POST /api/orders/draft  (public - called right after create-order, before
// the Razorpay modal opens)
// Stashes the full checkout payload keyed by razorpay_order_id. This is the
// safety net's data source: if the customer's browser never returns after
// paying (UPI app-switch killed the tab, network dropped, etc), the
// /api/payment/webhook route can still build the real order from this draft
// once Razorpay confirms payment.captured server-side. Best-effort — a
// failure here must never block checkout, so the frontend fires-and-forgets it.
router.post("/draft", async (req, res) => {
  try {
    const { razorpayOrderId, ...payload } = req.body || {};
    if (!razorpayOrderId) return res.status(400).json({ error: "razorpayOrderId is required" });
    await saveCheckoutDraft(razorpayOrderId, payload);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save checkout draft", err);
    res.status(500).json({ error: "Failed to save draft" });
  }
});

// POST /api/orders  (public - customer places order, Razorpay payment required)
// The order is only ever inserted once payment is verified: the frontend must
// have already completed the Razorpay checkout and pass back the order id,
// payment id, and signature it received, which are verified server-side
// against the key secret before anything is written to the DB.
router.post("/", async (req, res) => {
  const o = req.body;

  const paymentOk = await verifyRazorpaySignature({
    razorpayOrderId: o.razorpayOrderId,
    razorpayPaymentId: o.razorpayPaymentId,
    razorpaySignature: o.razorpaySignature,
  });
  if (!paymentOk) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  try {
    const { id } = await createOrder(o, {
      razorpayOrderId: o.razorpayOrderId,
      razorpayPaymentId: o.razorpayPaymentId,
    });
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to place order" });
  }
});

// GET /api/orders/:id  (public - track order by id, no auth so customers can track)
// SECURITY: order ids are sequential (STC0001, STC0002, ...) and this route is
// unauthenticated, so it must NOT return PII (email, phone, full address) —
// otherwise anyone can enumerate ids and harvest every customer's contact
// details. Only the fields the order-confirmation/tracking page actually
// needs are returned here.
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Order not found" });
    const o = rowToOrder(rows[0]);
    res.json({
      id: o.id,
      items: o.items,
      subtotal: o.subtotal,
      shipping: o.shipping,
      total: o.total,
      customerName: o.customerName,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      trackingId: o.trackingId,
      previewRequested: o.previewRequested,
      createdAt: o.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// PUT /api/orders/:id/request-preview (public - customer taps the WhatsApp
// "Request Preview Image" button on the order-confirmed page; just flips a
// flag so admin can see who's waiting on a preview reply)
router.put("/:id/request-preview", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE orders SET preview_requested = 1, preview_requested_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to flag preview request" });
  }
});

// GET /api/orders  (admin - list all)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows.map(rowToOrder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET /api/orders/notifications/unseen-count (admin - red dot on the Orders
// sidebar tab). Counts orders still sitting in "pending" — the dot stays up
// until each one is moved to "processing" (or beyond), not just until the
// admin opens the tab.
router.get("/notifications/unseen-count", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'");
    res.json({ count: rows[0].c });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch unseen count" });
  }
});

// PUT /api/orders/notifications/mark-seen (admin - clear the bell badge)
router.put("/notifications/mark-seen", requireAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE orders SET is_seen = 1 WHERE is_seen = 0");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark orders seen" });
  }
});

// PUT /api/orders/:id/status (admin)
router.put("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, trackingId } = req.body;
    if (trackingId !== undefined) {
      await pool.query("UPDATE orders SET status = ?, tracking_id = ? WHERE id = ?", [status, trackingId, req.params.id]);
    } else {
      await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// DELETE /api/orders/:id (admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

module.exports = router;
