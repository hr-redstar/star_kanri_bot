// utils/configManager.js
const { ensureGuildJSON, readJSON, writeJSON } = require('./fileHelper');
const { v4: uuidv4 } = require('uuid');
const { Mutex, withTimeout, E_TIMEOUT } = require('async-mutex');

/**
 * 排他制御付きラップ関数
 */
async function withLock(mutex, taskFn) {
  const release = await mutex.acquire();
  try {
    return await taskFn();
  } finally {
    release();
  }
}

/**
 * 統合設定管理クラス
 * 全ての機能の設定を一元管理
 */
class ConfigManager {
  constructor() {
    this.pathCache = new Map(); // ギルドごとのJSONパスをキャッシュ
    this.mutexes = new Map(); // ファイルパスごとのMutexインスタンスをキャッシュ
    this.configCache = new Map(); // ギルドごとの設定データをキャッシュ
    this.defaultConfig = {
      star: {
        adminRoleIds: [],
        notifyChannelId: null,
      },
      chatgpt: {
        apiKey: '',
        maxTokens: 150,
        temperature: 0.7,
        persona: null,
      },
      totusuna: {
        instances: []
      },
      kpi: {
        settings: {}
      }
    };
  }

  /**
   * ギルドのJSONファイルパスを取得（キャッシュ利用）
   * @param {string} guildId
   * @returns {Promise<string>}
   */
  async getJsonPath(guildId) {
    if (!this.pathCache.has(guildId)) {
      const path = await ensureGuildJSON(guildId, this.defaultConfig);
      this.pathCache.set(guildId, path);
    }
    return this.pathCache.get(guildId);
  }

  /**
   * ギルド設定を取得
   * @param {string} guildId
   * @returns {Promise<object>}
   */
  async getGuildConfig(guildId) {
    if (this.configCache.has(guildId))  {

      return this.configCache.get(guildId);
    }
    const jsonPath = await this.getJsonPath(guildId);
    const config = await readJSON(jsonPath);
    const mergedConfig = this._mergeWithDefaults(config);
    this.configCache.set(guildId, mergedConfig);
    return mergedConfig;
  }

  /**
   * ギルド設定を保存（排他制御付き）
   * @param {string} guildId
   * @param {object} config
   * @param {string} [context='Unknown Context'] - ロックエラー時のデバッグ用コンテキスト
   * @returns {Promise<void>}
   */
  async saveGuildConfig(guildId, config, context = 'Unknown Context') {
    const jsonPath = await this.getJsonPath(guildId);
    let mutex = this.mutexes.get(jsonPath);
    if (!mutex) {
      mutex = withTimeout(new Mutex(), 10000);
      this.mutexes.set(jsonPath, mutex);
    }

    try {
      await withLock(mutex, async () => {
        await writeJSON(jsonPath, config);
        // キャッシュを無効化する代わりに、保存した新しい設定で更新する
        this.configCache.set(guildId, config);
        logger.info(`[ConfigManager] Guild ${guildId} の設定キャッシュを更新しました。`);
      });
    } catch (e) {
      if (e === E_TIMEOUT) {
        // タイムアウトした場合、書き込みが成功したか不明なため、キャッシュを無効化して次の読み込みで再同期させるのが安全
        this.invalidateCache(guildId);
        const error = new Error(`ファイルロックの取得がタイムアウトしました (Context: ${context})`);
        logger.error(error.message, { error });
        throw error;
      }
      throw e;
    }
  }

  /**
   * 特定セクションの設定を取得
   * @param {string} guildId 
   * @param {string} section - 'star', 'chatgpt', 'totusuna', 'kpi'
   * @returns {Promise<object>}
   */
  async getSectionConfig(guildId, section) {
    const config = await this.getGuildConfig(guildId);
    return config[section] ?? this.defaultConfig[section];
  }

  /**
   * 特定セクションの設定を更新
   * @param {string} guildId 
   * @param {string} section 
   * @param {object} sectionConfig 
   * @returns {Promise<void>}
   */
  async updateSectionConfig(guildId, section, sectionConfig) {
    const currentConfig = await this.getGuildConfig(guildId);
    // 不変性を保つため、キャッシュされたオブジェクトのディープコピーを作成して変更する
    const newConfig = this._deepClone(currentConfig);
    newConfig[section] = { ...(newConfig[section] ?? {}), ...sectionConfig };
    await this.saveGuildConfig(guildId, newConfig, `updateSectionConfig: ${section}`);
  }

  /**
   * Adds an item to an array within a specific configuration section.
   * @param {string} guildId
   * @param {string} section The top-level section key (e.g., 'totusuna').
   * @param {string} arrayKey The key of the array within the section (e.g., 'instances').
   * @param {object} itemData The item to add to the array.
   * @returns {Promise<object>} The added item.
   */
  async addItemToArray(guildId, section, arrayKey, itemData) {
    const currentConfig = await this.getGuildConfig(guildId);
    const newConfig = this._deepClone(currentConfig);

    newConfig[section] = newConfig[section] ?? {};
    newConfig[section][arrayKey] = newConfig[section][arrayKey] ?? [];
    newConfig[section][arrayKey].push(itemData);

    await this.saveGuildConfig(guildId, newConfig, `addItemToArray: ${section}.${arrayKey}`);
    return itemData;
  }

  /**
   * Updates an item in an array within a specific configuration section.
   * @param {string} guildId
   * @param {string} section
   * @param {string} arrayKey
   * @param {string} itemId The ID of the item to update.
   * @param {object} updates The properties to update.
   * @param {string} [idField='id'] The name of the ID field in the array items.
   * @returns {Promise<boolean>} True if the item was found and updated.
   */
  async updateItemInArray(guildId, section, arrayKey, itemId, updates, idField = 'id') {
    const currentConfig = await this.getGuildConfig(guildId);
    const newConfig = this._deepClone(currentConfig);

    if (!newConfig[section]?.[arrayKey]) return false;

    const itemIndex = newConfig[section][arrayKey].findIndex(item => item[idField] === itemId);
    if (itemIndex === -1) return false;

    newConfig[section][arrayKey][itemIndex] = { ...newConfig[section][arrayKey][itemIndex], ...updates };

    await this.saveGuildConfig(guildId, newConfig, `updateItemInArray: ${section}.${arrayKey}[${itemId}]`);
    return true;
  }

  /**
   * Removes an item from an array within a specific configuration section.
   * @param {string} guildId
   * @param {string} section
   * @param {string} arrayKey
   * @param {string} itemId The ID of the item to remove.
   * @param {string} [idField='id'] The name of the ID field in the array items.
   * @returns {Promise<boolean>} True if the item was found and removed.
   */
  async removeItemFromArray(guildId, section, arrayKey, itemId, idField = 'id') {
    const currentConfig = await this.getGuildConfig(guildId);
    const newConfig = this._deepClone(currentConfig);

    if (!newConfig[section]?.[arrayKey]) return false;

    const originalLength = newConfig[section][arrayKey].length;
    newConfig[section][arrayKey] = newConfig[section][arrayKey].filter(item => item[idField] !== itemId);

    if (newConfig[section][arrayKey].length < originalLength) {
      await this.saveGuildConfig(guildId, newConfig, `removeItemFromArray: ${section}.${arrayKey}[${itemId}]`);
      return true;
    }
    return false;
  }

  /**
   * 指定されたギルドの設定キャッシュを無効化する
   * @param {string} guildId
   */
  invalidateCache(guildId) {
    if (this.configCache.has(guildId)) {
      this.configCache.delete(guildId);
      logger.info(`[ConfigManager] Guild ${guildId} の設定キャッシュを無効化しました。`);
    }
  }

  /**
   * Performs a deep clone of a JSON-compatible object.
   * @private
   * @param {any} obj The object to clone.
   * @returns {any} The cloned object.
   */
  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this._deepClone(item));
    }

    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = this._deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  /**
   * Helper to check if a value is a plain object.
   * @private
   */
  _isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * Deeply merges the `source` object into the `target` object.
   * @private
   */
  _deepMerge(target, source) {
    const output = { ...target };
    if (this._isObject(target) && this._isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this._isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this._deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  /**
  * @param {string} guildId
   * デフォルト値とマージ
   * @private
   * @param {object} config 
   * @returns {object}
   */
  _mergeWithDefaults(config) {
    // Perform a deep merge of the default config and the loaded config.
    // This ensures that new default properties are added to existing configs.
    return this._deepMerge(this.defaultConfig, config);
  }

}

// シングルトンインスタンス
const configManager = new ConfigManager();

module.exports = {
  ConfigManager,
  configManager
};