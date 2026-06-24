const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getRecentAlerts } = require("../services/alertStore");

const router = express.Router();

// JWT protected — returns the most recent 10 anomaly alerts
router.get("/", requireAuth, (req, res) => {
  res.json({ success: true, count: 10, alerts: getRecentAlerts(10) });
});

module.exports = router;