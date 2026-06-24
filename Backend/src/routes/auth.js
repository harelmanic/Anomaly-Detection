const express = require("express");
const jwt = require("jsonwebtoken");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
const API_SECRET = process.env.API_SECRET || "tealvue-dev-secret";

router.post("/token", authLimiter, (req, res) => {
  const { secret } = req.body;

  if (!secret || secret !== API_SECRET) {
    return res.status(401).json({ success: false, error: "Invalid secret" });
  }

  const token = jwt.sign({ role: "dashboard" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });

  res.json({ success: true, token });
});

module.exports = router;