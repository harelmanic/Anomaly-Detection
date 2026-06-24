const { processTick } = require("./detectionEngine");
const { feedEvents } = require("./feedClient");

const CLONES_PER_SYMBOL = 100;
let active = false;

// This is a SIMULATION — not a real feed.
// Fans each real tick out to N virtual symbol streams to stress-test the detection pipeline.
function startScaleSimulation(realSymbols) {
  if (active) return;
  active = true;

  console.log(`[Scale] Simulating ${realSymbols.length} × ${CLONES_PER_SYMBOL} = ${realSymbols.length * CLONES_PER_SYMBOL} virtual streams`);

  feedEvents.on("tick", (tick) => {
    const realSymbol = tick.SYMBOL;
    if (!realSymbols.includes(realSymbol)) return;

    for (let i = 1; i <= CLONES_PER_SYMBOL; i++) {
      const virtualSymbol = `${realSymbol}_${String(i).padStart(3, "0")}`;
      const jitter = 1 + (Math.random() - 0.5) * 0.002;
      processTick({ ...tick, SYMBOL: virtualSymbol, LTP: tick.LTP * jitter }, realSymbol);
    }
  });
}

module.exports = { startScaleSimulation };