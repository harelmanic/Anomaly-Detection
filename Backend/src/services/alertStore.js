const { nanoid } = require("nanoid");
const { EventEmitter } = require("events");

const alertEvents = new EventEmitter();

const MAX_STORED = 100;
const alerts = [];

// Cooldown prevents the same symbol from spamming alerts within 30 real seconds
const cooldowns = new Map();
const COOLDOWN_MS = 5_000;

function addAlert({ symbol, timestamp, reason }) {
  const lastFired = cooldowns.get(symbol) || 0;
  const now = Date.now();
  if (now - lastFired < COOLDOWN_MS) return null;
  cooldowns.set(symbol, now);

  const alert = {
    alertRef: `TV-${nanoid(5).toUpperCase()}`, // required field from the brief
    symbol,
    timestamp,
    reason,
    createdAt: new Date().toISOString(),
  };

  alerts.push(alert);
  if (alerts.length > MAX_STORED) alerts.shift();

  console.log(`[Alert] ${alert.alertRef} | ${symbol} | ${reason}`);
  alertEvents.emit("new_alert", alert);

  return alert;
}

function getRecentAlerts(limit = 10) {
  return [...alerts].reverse().slice(0, limit);
}

module.exports = { addAlert, getRecentAlerts, alertEvents };