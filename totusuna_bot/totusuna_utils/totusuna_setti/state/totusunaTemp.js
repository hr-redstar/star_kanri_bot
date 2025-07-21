// utils/totusuna_setti/state/totusunaTemp.js

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * A temporary in-memory store for multi-step interactions, with automatic cleanup.
 */
class TempStateStore {
  /**
   * @param {number} [ttl=900000] - Time-to-live for entries in milliseconds.
   */
  constructor(ttl = DEFAULT_TTL_MS) {
    this.store = new Map();
    this.ttl = ttl;

    // Start a periodic cleanup job.
    this.cleanupInterval = setInterval(() => this.cleanup(), this.ttl);
    // Allow the Node.js process to exit even if this interval is active.
    this.cleanupInterval.unref();
  }

  /**
   * Generates a unique key for the store.
   * @private
   * @param {string} guildId
   * @param {string} userId
   * @returns {string}
   */
  _getKey(guildId, userId) {
    return `${guildId}:${userId}`;
  }

  get(guildId, userId) {
    const entry = this.store.get(this._getKey(guildId, userId));
    return entry ? entry.data : null;
  }

  set(guildId, userId, data) {
    const key = this._getKey(guildId, userId);
    this.store.set(key, { data, timestamp: Date.now() });
  }

  delete(guildId, userId) {
    return this.store.delete(this._getKey(guildId, userId));
  }

  /**
   * Removes stale entries from the store.
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.store.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(`[TempStateStore] Cleaned up ${cleanedCount} stale entries.`);
    }
  }

  /**
   * Gets all stored data for debugging.
   * @returns {[string, {data: object, timestamp: number}][]}
   */
  getAll() {
    return Array.from(this.store.entries());
  }
}

// Export a single, shared instance of the store.
module.exports = new TempStateStore();
