const windows = new Map();

function checkSpike(symbol, price, simTime, config) {
  const { thresholdPercent, windowSec } = config;

  const windowTicks = Math.max(2, Math.ceil(windowSec / 30));

  if (!windows.has(symbol)) windows.set(symbol, []);
  const window = windows.get(symbol);

  window.push(price);

    if (window.length > windowTicks) {
    window.shift();
  }

  if (window.length < 2) return null;

  const oldestPrice = window[0];
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