const rateLimit = require("express-rate-limit");

// Applied globally — 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests — slow down" },
});

// Stricter limit on the token endpoint to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many token requests — wait 15 minutes" },
});

module.exports = { globalLimiter, authLimiter };