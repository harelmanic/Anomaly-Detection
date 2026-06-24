require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");

const { watchConfig, getConfig } = require("./config/configLoader");
const { connect: connectFeed, resubscribe } = require("./services/feedClient");
const { attachWebSocket } = require("./services/wsRelay");
const { startScaleSimulation } = require("./services/scaleSimulator");
const { globalLimiter } = require("./middleware/rateLimiter");

const authRoutes = require("./routes/auth");
const alertRoutes = require("./routes/alerts");
const symbolRoutes = require("./routes/symbols");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(globalLimiter);

app.use("/auth", authRoutes);
app.use("/alerts", alertRoutes);
app.use("/symbols", symbolRoutes);

app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`[Server] Listening on http://localhost:${PORT}`);

  // Pass resubscribe as the onChange callback — fires once per config save
  watchConfig(resubscribe);
  connectFeed();
  attachWebSocket(server);

  if (process.env.ENABLE_SCALE_SIMULATION === "true") {
    startScaleSimulation(Object.keys(getConfig()));
  }
});

process.on("SIGTERM", () => {
  console.log("[Server] Shutting down gracefully...");
  server.close(() => process.exit(0));
});