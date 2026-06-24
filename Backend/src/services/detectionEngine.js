const { getConfig } = require("../config/configLoader");
const { checkSpike, resetSpike } = require("../strategies/spikeStrategy");
const { checkMovingAverage, resetMovingAverage } = require("../strategies/movingAverageStrategy");
const { addAlert } = require("./alertStore");
const { parseTs } = require("../utils/parseTs");

const warmingUp = new Map();
const BURST_SILENCE_MS = 500;
const LOG_EVERY_N_TICKS = 10;
const tickCounters = new Map();

function processTick(tick, realSymbol) {
  const config = getConfig();
  const symbolConfig = config[realSymbol];
  if (!symbolConfig) return;

  const price = tick.LTP;
  const simTime = parseTs(tick.TS);

  if (!warmingUp.has(realSymbol)) {
    warmingUp.set(realSymbol, { isWarm: false, lastTickAt: null, timer: null });
  }

  const state = warmingUp.get(realSymbol);

  if (state.timer) clearTimeout(state.timer);
  state.lastTickAt = Date.now();

  if (!state.isWarm) {
    state.timer = setTimeout(() => {
      console.log(`[Detection] Burst complete for ${realSymbol} — anomaly detection now active`);
      state.isWarm = true;
    }, BURST_SILENCE_MS);
  }

  // Always feed data into the window so it's primed when live detection starts
  const reason = runStrategy(realSymbol, price, simTime, symbolConfig);

  const count = (tickCounters.get(realSymbol) || 0) + 1;
  tickCounters.set(realSymbol, count);
  if (count % LOG_EVERY_N_TICKS === 0) {
    console.log(`[Detection] ${realSymbol} | tick #${count} | ₹${price} | warm=${state.isWarm} | ${reason || "no anomaly"}`);
  }

  if (state.isWarm && reason) {
    addAlert({ symbol: realSymbol, timestamp: tick.TS, reason });
  }
}

function runStrategy(symbol, price, simTime, config) {
  switch (config.strategy) {
    case "spike":
      return checkSpike(symbol, price, simTime, config);
    case "movingAverage":
      return checkMovingAverage(symbol, price, config);
    default:
      console.warn(`[Detection] Unknown strategy "${config.strategy}" for ${symbol}`);
      return null;
  }
}

function resetSymbol(symbol) {
  resetSpike(symbol);
  resetMovingAverage(symbol);
  warmingUp.delete(symbol);
  tickCounters.delete(symbol);
  console.log(`[Detection] State reset for ${symbol}`);
}

module.exports = { processTick, resetSymbol };