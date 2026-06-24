// Spike/Drop strategy
// Fires when price moves more than X% within a sliding window of Y simulated seconds

const windows = new Map();

function checkSpike(symbol, price, simTime, config) {
  const { thresholdPercent, windowSec } = config;

  if (!windows.has(symbol)) windows.set(symbol, []);
  const window = windows.get(symbol);

  window.push({ price, simTs: simTime.getTime() });

  // Remove ticks older than the configured window
  const cutoff = simTime.getTime() - windowSec * 1000;
  while (window.length > 0 && window[0].simTs < cutoff) {
    window.shift();
  }

  if (window.length < 2) return null;

  const oldestPrice = window[0].price;
  const changePct = ((price - oldestPrice) / oldestPrice) * 100;

  if (Math.abs(changePct) >= thresholdPercent) {
    const direction = changePct > 0 ? "spike" : "drop";
    return `Price ${direction} of ${changePct.toFixed(2)}% detected within ${windowSec}s window (from ${oldestPrice.toFixed(2)} to ${price.toFixed(2)})`;
  }

  return null;
}

function resetSpike(symbol) {
  windows.delete(symbol);
}

module.exports = { checkSpike, resetSpike };