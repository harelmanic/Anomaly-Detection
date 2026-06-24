const { io } = require("socket.io-client");
const { getConfig } = require("../config/configLoader");
const { processTick, resetSymbol } = require("./detectionEngine");
const { EventEmitter } = require("events");

const feedEvents = new EventEmitter();
const FEED_URL = "https://mock-data.tealvue.in";

let socket = null;
const latestPrices = new Map();

function getLatestPrices() {
  return Object.fromEntries(latestPrices);
}

function connect() {
  socket = io(FEED_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: Infinity,
  });

  socket.on("connect", () => {
    console.log("[Feed] Connected to TealVue ticker:", socket.id);
    subscribeToSymbols();
  });

  socket.on("disconnect", (reason) => {
    console.warn("[Feed] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[Feed] Connection error:", err.message);
  });

  socket.on("ticker", (tick) => {
    const symbol = tick.SYMBOL;
    latestPrices.set(symbol, { price: tick.LTP, timestamp: tick.TS, volume: tick.TTQ });
    feedEvents.emit("tick", tick);
    processTick(tick, symbol);
  });
}

// Per API docs — subscribe overwrites the prior list, so always send all symbols at once
function subscribeToSymbols() {
  const symbols = Object.keys(getConfig());
  if (!symbols.length) {
    console.warn("[Feed] No symbols in config — nothing to subscribe to");
    return;
  }
  console.log("[Feed] Subscribing to symbols:", symbols);
  socket.emit("subscribe", symbols);
}

function resubscribe() {
  const symbols = Object.keys(getConfig());
  symbols.forEach(resetSymbol);
  if (socket && socket.connected) {
    console.log("[Feed] Re-subscribing after config reload:", symbols);
    socket.emit("subscribe", symbols);
  }
}

module.exports = { connect, resubscribe, feedEvents, getLatestPrices };