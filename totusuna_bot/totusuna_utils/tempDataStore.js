// utils/tempDataStore.js
const logger = require('./logger');

/**
 * @description
 * A simple in-memory key-value store for temporarily holding data between
 * interaction steps (e.g., from a modal to a select menu).
 * Includes an automatic cleanup mechanism to prevent memory leaks.
 */
const store = new Map();
const EXPIRATION_TIME_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Cleans up expired entries from the store.
 */
function cleanup() {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (!value.timestamp || now - value.timestamp > EXPIRATION_TIME_MS) {
      store.delete(key);
      logger.info(`[tempDataStore] Expired temporary key removed: ${key}`);
    }
  }
}

// Periodically run cleanup every 5 minutes.
setInterval(cleanup, 5 * 60 * 1000);

module.exports = { tempDataStore: store };