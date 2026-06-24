const { Server } = require("socket.io");
const { feedEvents, getLatestPrices } = require("./feedClient");
const { alertEvents, getRecentAlerts } = require("./alertStore");

let io = null;

function attachWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("[WS Relay] Dashboard client connected:", socket.id);

    // Send current state immediately so dashboard isn't blank on load
    socket.emit("price_snapshot", getLatestPrices());
    socket.emit("alert_snapshot", getRecentAlerts(10));

    socket.on("disconnect", () => {
      console.log("[WS Relay] Dashboard client disconnected:", socket.id);
    });
  });

  feedEvents.on("tick", (tick) => {
    if (io) {
      io.emit("tick", {
        symbol: tick.SYMBOL,
        price: tick.LTP,
        timestamp: tick.TS,
        volume: tick.TTQ,
        open: tick.OPEN,
        high: tick.HIGH,
        low: tick.LOW,
      });
    }
  });

  alertEvents.on("new_alert", (alert) => {
    if (io) io.emit("alert", alert);
  });

  console.log("[WS Relay] WebSocket server attached");
}

module.exports = { attachWebSocket };