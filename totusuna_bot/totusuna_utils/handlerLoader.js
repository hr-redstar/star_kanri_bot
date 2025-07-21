// utils/handlerLoader.js

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// 除外ファイル一覧
const EXCLUDED_FILES = new Set(['index.js', 'handleSelect.js', 'install_channel.js']);

/**
 * @typedef {object} Handler
 * @property {string} [customId] - 完全一致する customId
 * @property {string} [customIdStart] - 前方一致する customId
 * @property {(interaction: import('discord.js').Interaction) => Promise<void>} handle - インタラクションを処理する関数
 */

/**
 * 有効なハンドラかを検証
 * @param {*} mod 
 * @returns {boolean}
 */
function isValidHandler(mod) {
  return (
    mod &&
    typeof mod.handle === 'function' &&
    (typeof mod.customId === 'string' || typeof mod.customIdStart === 'string')
  );
}

/**
 * 指定ディレクトリからハンドラを読み込んでルーティング関数を返す
 * @description この関数は同期的に実行されます。
 * @param {string} dirPath - ディレクトリの絶対パス
 * @returns {(customId: string) => Handler|null}
 */
function loadHandlers(dirPath) {
  const handlers = {};
  const startsWithHandlers = [];

  let fileNames;
  try {
    fileNames = fs.readdirSync(dirPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
    } else {
      logger.error(`[handlerLoader] Failed to read directory: ${dirPath}`, { error: err });
    }
    return () => null;
  }

  const files = fileNames.filter(file => file.endsWith('.js') && !EXCLUDED_FILES.has(file));

  for (const file of files) {
    const modulePath = path.join(dirPath, file);
    try {
      if (process.env.NODE_ENV !== 'production') {
        delete require.cache[require.resolve(modulePath)];
      }

      const mod = require(modulePath);

      if (!isValidHandler(mod)) {
        logger.warn(`[handlerLoader] Invalid handler, skipping: ${file}`);
        continue;
      }

      if (mod.customId) {
        if (handlers[mod.customId]) {
          logger.warn(
            `[handlerLoader] Duplicate customId "${mod.customId}" in ${file}. It will be overwritten.`
          );
        }
        handlers[mod.customId] = mod;
      } else if (mod.customIdStart) {
        const duplicate = startsWithHandlers.find(h => h.key === mod.customIdStart);
        if (duplicate) {
          logger.warn(
            `[handlerLoader] Duplicate customIdStart "${mod.customIdStart}". '${file}' conflicts with '${path.basename(
              duplicate.filePath
            )}' and will be skipped.`
          );
          continue;
        }
        startsWithHandlers.push({ key: mod.customIdStart, handler: mod, filePath: modulePath });
      }

    } catch (err) {
      logger.error(`[handlerLoader] Failed to load handler: ${file}`, { error: err });
    }
  }

  // 長い prefix 優先
  startsWithHandlers.sort((a, b) => b.key.length - a.key.length);

  const dirName = path.basename(dirPath);
  if (Object.keys(handlers).length > 0) {
    logger.info(`[handlerLoader] Loaded exact match handlers for ${dirName}:`, {
      handlers: Object.keys(handlers),
    });
  }
  if (startsWithHandlers.length > 0) {
    logger.info(`[handlerLoader] Loaded startsWith handlers for ${dirName}:`, {
      handlers: startsWithHandlers.map(h => h.key),
    });
  }

  const total = Object.keys(handlers).length + startsWithHandlers.length;
  if (total > 0) {
    logger.info(`[handlerLoader] ✅ Registered ${total} handlers for ${dirName}.`);
  }

  /**
   * customId に対応するハンドラを返す
   * @param {string} customId
   * @returns {Handler|null}
   */
  return function findHandler(customId) {
    if (handlers[customId]) return handlers[customId];

    for (const { key, handler } of startsWithHandlers) {
      if (customId.startsWith(key)) return handler;
    }

    return null;
  };
}

module.exports = { loadHandlers };
