// Moving Average Deviation strategy
// Uses a circular buffer for O(1) updates — no shifting or splicing

class CircularBuffer {
  constructor(size) {
    this.size = size;
    this.buf = new Array(size).fill(null);
    this.head = 0;
    this.count = 0;
    this.sum = 0;
  }

  push(value) {
    const evicted = this.buf[this.head];
    if (evicted !== null) this.sum -= evicted;
    this.buf[this.head] = value;
    this.sum += value;
    this.head = (this.head + 1) % this.size;
    if (this.count < this.size) this.count++;
  }

  average() {
    return this.count === 0 ? null : this.sum / this.count;
  }

  isFull() {
    return this.count === this.size;
  }
}

const buffers = new Map();

function checkMovingAverage(symbol, price, config) {
  const { deviationPercent, sampleSize } = config;

  if (!buffers.has(symbol)) {
    buffers.set(symbol, new CircularBuffer(sampleSize));
  }
  const buf = buffers.get(symbol);

  // Compute deviation BEFORE pushing so current price isn't in its own average
  const avg = buf.average();
  buf.push(price);

  // Wait until buffer is full to avoid false alerts on sparse early data
  if (!buf.isFull() || avg === null) return null;

  const deviationPct = ((price - avg) / avg) * 100;

  if (Math.abs(deviationPct) >= deviationPercent) {
    const direction = deviationPct > 0 ? "above" : "below";
    return `Price ${price.toFixed(2)} is ${Math.abs(deviationPct).toFixed(2)}% ${direction} the ${sampleSize}-sample moving average of ${avg.toFixed(2)}`;
  }

  return null;
}

function resetMovingAverage(symbol) {
  buffers.delete(symbol);
}

module.exports = { checkMovingAverage, resetMovingAverage };