const pool = require("./db");

// Razorpay credentials now live in the DB (set from Admin Panel -> Settings ->
// Payment) instead of .env, so the site works out of the box without any
// Razorpay keys in the environment. This module reads them with a short
// in-memory cache so we're not hitting MySQL on every checkout request.

let cache = null;
let cachedAt = 0;
const CACHE_MS = 30 * 1000;

async function getPaymentCredentials({ forceRefresh = false } = {}) {
  const isFresh = cache && Date.now() - cachedAt < CACHE_MS;
  if (isFresh && !forceRefresh) return cache;

  const [rows] = await pool.query(
    "SELECT razorpay_key_id, razorpay_key_secret, enabled FROM payment_credentials WHERE id = 1"
  );
  const row = rows[0] || {};
  cache = {
    keyId: row.razorpay_key_id || null,
    keySecret: row.razorpay_key_secret || null,
    enabled: !!row.enabled && !!row.razorpay_key_id && !!row.razorpay_key_secret,
  };
  cachedAt = Date.now();
  return cache;
}

function invalidatePaymentCredentialsCache() {
  cache = null;
}

module.exports = { getPaymentCredentials, invalidatePaymentCredentialsCache };
