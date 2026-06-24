const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

const CONFIG_PATH = path.join(__dirname, "symbols.json");

let symbolConfig = {};

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    symbolConfig = JSON.parse(raw);
    console.log("[Config] Loaded symbol config:", Object.keys(symbolConfig));
  } catch (err) {
    console.error("[Config] Failed to parse symbols.json:", err.message);
  }
}

function getConfig() {
  return symbolConfig;
}

// onChange is called after every successful reload — used to trigger resubscribe
function watchConfig(onChange) {
  loadConfig();

  chokidar.watch(CONFIG_PATH).on("change", () => {
    console.log("[Config] symbols.json changed — reloading...");
    loadConfig();
    if (typeof onChange === "function") onChange();
  });
}

module.exports = { watchConfig, getConfig };