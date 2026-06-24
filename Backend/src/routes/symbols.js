const express = require("express");
const { getConfig } = require("../config/configLoader");
const { getLatestPrices } = require("../services/feedClient");

const router = express.Router();

// Public — dashboard uses this on load to know what symbols to show
router.get("/", (req, res) => {
  const config = getConfig();
  const prices = getLatestPrices();

  const symbols = Object.entries(config).map(([symbol, cfg]) => ({
    symbol,
    strategy: cfg.strategy,
    latestPrice: prices[symbol] || null,
  }));

  res.json({ success: true, symbols });
});

module.exports = router;