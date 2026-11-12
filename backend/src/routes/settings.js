const express = require("express");
const pool = require("../config/db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT settings_json FROM store_settings WHERE id = 1");
    res.json(rows.length ? JSON.parse(rows[0].settings_json) : {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Keys that are only ever written by their own admin tab. Other admin tabs hold a
// copy of the settings loaded earlier and save the WHOLE object, which used to wipe
// these keys (saved in admin, but missing on the product page). A request may only
// change a protected key if it declares ownership via the x-settings-owns header.
const PROTECTED_KEYS = ["materialDescriptions", "materialProductDescriptions"];

router.put("/", requireAdmin, async (req, res) => {
  try {
    const incoming = req.body && typeof req.body === "object" ? { ...req.body } : {};
    const owns = String(req.headers["x-settings-owns"] || "").split(",").map((k) => k.trim()).filter(Boolean);
    const [rows] = await pool.query("SELECT settings_json FROM store_settings WHERE id = 1");
    let existing = {};
    try { existing = rows.length ? JSON.parse(rows[0].settings_json) : {}; } catch { existing = {}; }
    for (const key of PROTECTED_KEYS) {
      if (owns.includes(key)) continue;
      if (existing[key] !== undefined) incoming[key] = existing[key];
      else delete incoming[key];
    }
    await pool.query("UPDATE store_settings SET settings_json = ? WHERE id = 1", [JSON.stringify(incoming)]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

module.exports = router;
