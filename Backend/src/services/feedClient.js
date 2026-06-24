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

  const burstCount = new Map();
  socket.on("ticker", (tick) => {
    const symbol = tick.SYMBOL;
    // Temporary: count burst ticks per symbol
    burstCount.set(symbol, (burstCount.get(symbol) || 0) + 1);
    console.log(`[Feed] ${symbol} tick #${burstCount.get(symbol)}`);

    const price = tick.CLOSE ?? tick.LTP ?? tick.ATP;

    if (!symbol || price === undefined) {
      console.warn("[Feed] Tick missing symbol or price:", JSON.stringify(tick));
      return;
    }

    const normalisedTick = {
      SYMBOL: symbol,
      LTP: price,
      TS: tick.TS,
      TTQ: tick.TTQ,
      OPEN: tick.OPEN,
      HIGH: tick.HIGH,
      LOW: tick.LOW,
      CLOSE: tick.CLOSE,
    };

    latestPrices.set(symbol, {
      price: price,
      timestamp: tick.TS,
      volume: tick.TTQ,
    });

    feedEvents.emit("tick", normalisedTick);
    processTick(normalisedTick, symbol);
  });
}

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