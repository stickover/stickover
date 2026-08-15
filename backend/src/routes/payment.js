const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const pool = require("../config/db");
const { requireAdmin } = require("../middleware/auth");
const { getPaymentCredentials, invalidatePaymentCredentialsCache } = require("../config/paymentCredentials");
const { createOrder, getCheckoutDraft } = require("../services/orderService");

const router = express.Router();

// The Razorpay client is built fresh from whatever credentials are currently
// in the DB (set via Admin Panel -> Settings -> Payment), NOT from .env.
// This means the site works out of the box with no keys anywhere in the
// environment - the admin enters them once from the dashboard and every
// checkout call picks them up automatically.
async function getRazorpayClient() {
  const creds = await getPaymentCredentials();
  if (!creds.enabled) return null;
  return new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret });
}

// GET /api/payment/config (public)
// Tells the storefront whether online payment is currently turned on, and
// hands back the public key_id (safe to expose client-side - it's the
// "publishable" key, same as how Stripe's pk_ key works). The key_secret
// NEVER appears in any response from this file.
router.get("/config", async (req, res) => {
  try {
    const creds = await getPaymentCredentials();
    res.json({ enabled: creds.enabled, keyId: creds.enabled ? creds.keyId : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payment config" });
  }
});

// GET /api/payment/admin-config (admin only)
// Returns the current Key ID and whether a secret is saved (masked - never
// the actual secret) + enabled flag, so the admin settings page can show
// what's already configured without ever displaying the real secret back.
router.get("/admin-config", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT razorpay_key_id, razorpay_key_secret, enabled FROM payment_credentials WHERE id = 1"
    );
    const row = rows[0] || {};
    res.json({
      keyId: row.razorpay_key_id || "",
      hasSecret: !!row.razorpay_key_secret,
      enabled: !!row.enabled,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payment settings" });
  }
});

// PUT /api/payment/admin-config (admin only)
// Body: { keyId, keySecret, enabled }
// keySecret can be omitted/blank to KEEP the existing saved secret (so the
// admin doesn't have to re-type it every time they just want to toggle
// enabled on/off or fix a typo in the key id).
router.put("/admin-config", requireAdmin, async (req, res) => {
  try {
    const keyId = (req.body.keyId || "").trim();
    const keySecretInput = (req.body.keySecret || "").trim();
    const enabled = !!req.body.enabled;

    if (enabled && !keyId) {
      return res.status(400).json({ error: "Key ID is required to enable online payment" });
    }

    if (keySecretInput) {
      await pool.query(
        "UPDATE payment_credentials SET razorpay_key_id = ?, razorpay_key_secret = ?, enabled = ? WHERE id = 1",
        [keyId, keySecretInput, enabled ? 1 : 0]
      );
    } else {
      // Keep existing secret untouched.
      const [rows] = await pool.query("SELECT razorpay_key_secret FROM payment_credentials WHERE id = 1");
      if (enabled && !(rows[0] && rows[0].razorpay_key_secret)) {
        return res.status(400).json({ error: "Key Secret is required to enable online payment" });
      }
      await pool.query(
        "UPDATE payment_credentials SET razorpay_key_id = ?, enabled = ? WHERE id = 1",
        [keyId, enabled ? 1 : 0]
      );
    }

    invalidatePaymentCredentialsCache();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save payment settings" });
  }
});

// POST /api/payment/create-order (public)
// Creates a Razorpay order for the given amount (in rupees) and returns the
// order id + public key so the frontend can open the Razorpay checkout modal.
// The amount must always be computed/trusted from the cart on checkout, but
// since this backend doesn't hold product prices server-side today, the
// frontend-computed total is used here - the amount is re-validated to be a
// sane positive number to avoid ₹0 / negative order creation.
router.post("/create-order", async (req, res) => {
  try {
    const rzp = await getRazorpayClient();
    if (!rzp) {
      return res.status(503).json({
        error: "Online payment isn't set up yet. Add your Razorpay keys in Admin -> Settings -> Payment.",
      });
    }
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid order amount" });
    }
    const order = await rzp.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `stc_${Date.now()}`,
    });
    const creds = await getPaymentCredentials();
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: creds.keyId,
    });
  } catch (err) {
    console.error("Razorpay order creation failed", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// Shared signature check used by the orders route after a successful checkout.
// HMAC-SHA256 of "order_id|payment_id" signed with the key secret must match
// the signature Razorpay hands back to the frontend - this is what proves the
// payment actually happened and wasn't just a client claiming success.
// Now async since the secret is read from the DB, not process.env.
async function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  const creds = await getPaymentCredentials();
  if (!creds.keySecret) return false;
  const expected = crypto
    .createHmac("sha256", creds.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return expected === razorpaySignature;
}

// POST /api/payment/webhook (public — called by Razorpay's servers, not the browser)
// SAFETY NET: normally an order is created (and the Purchase pixel fired)
// by the frontend's Razorpay `handler` callback right after payment
// succeeds. But that callback can be lost — most commonly a customer pays
// via a UPI app (GPay/PhonePe), the mobile browser tab gets suspended or
// reloaded during the app-switch, and the tab never runs the callback even
// though Razorpay actually captured the payment. That silently drops both
// the order AND the Purchase conversion event.
//
// This route listens for Razorpay's `payment.captured` webhook (configure
// this URL + a webhook secret in the Razorpay Dashboard → Settings →
// Webhooks, and set RAZORPAY_WEBHOOK_SECRET in the backend .env to match).
// It verifies the signature, looks up the checkout draft saved right before
// the Razorpay modal opened (see /api/orders/draft), and — only if no order
// already exists for that razorpay_order_id — creates the order and fires
// the Purchase event server-side via Meta CAPI. Fully idempotent, so it's
// safe even if Razorpay retries the webhook or the browser callback *also*
// eventually fires.
router.post("/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      // Not configured yet — ack with 200 so Razorpay doesn't keep retrying,
      // but log it so it's obvious this safety net is currently a no-op.
      console.warn("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping verification, ignoring event.");
      return res.status(200).json({ skipped: true });
    }

    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody;
    if (!signature || !rawBody) {
      return res.status(400).json({ error: "Missing signature or body" });
    }
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (expected !== signature) {
      console.error("[Razorpay Webhook] signature mismatch");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = req.body;
    if (event.event !== "payment.captured") {
      // Not the event we care about — ack and ignore.
      return res.status(200).json({ ignored: event.event });
    }

    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    const razorpayPaymentId = payment?.id;
    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(200).json({ ignored: "missing order/payment id" });
    }

    const draft = await getCheckoutDraft(razorpayOrderId);
    if (!draft) {
      // No draft saved (e.g. very old payment, or draft save itself failed) —
      // nothing we can safely reconstruct an order from. Ack so Razorpay
      // stops retrying; this just means the browser-side path is the only
      // record for this particular payment.
      console.warn(`[Razorpay Webhook] no checkout draft found for ${razorpayOrderId}`);
      return res.status(200).json({ ignored: "no draft found" });
    }

    const { id: orderId, alreadyExisted } = await createOrder(draft, { razorpayOrderId, razorpayPaymentId });

    if (!alreadyExisted) {
      // Fire Purchase server-side. No eventId shared with a browser pixel
      // call here (there may never have been one) — Meta will just record
      // it as its own event; if the browser *also* eventually fires with a
      // fresh eventId that's a harmless duplicate-looking event on Meta's
      // side, not a real double-counted order in our own DB either way.
      try {
        const { sendCapiEvent } = require("./metaAds");
        await sendCapiEvent({
          eventName: "Purchase",
          eventId: `so_webhook_${razorpayPaymentId}`,
          orderId,
          total: draft.total,
          currency: "INR",
          contentIds: (draft.items || []).map((i) => i.product?.id || i.productId).filter(Boolean),
          numItems: (draft.items || []).reduce((s, i) => s + (i.quantity || 1), 0),
          customerEmail: draft.customerEmail,
          customerPhone: draft.customerPhone,
          customerName: draft.customerName,
        });
      } catch (err) {
        console.error("[Razorpay Webhook] Meta CAPI purchase failed", err);
      }
    }

    res.status(200).json({ success: true, orderId, alreadyExisted });
  } catch (err) {
    console.error("[Razorpay Webhook] error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

module.exports = router;
module.exports.verifyRazorpaySignature = verifyRazorpaySignature;
