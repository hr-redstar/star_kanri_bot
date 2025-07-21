// utils/fileHelper.js

const fs = require('fs/promises');
const path = require('path');
const logger = require('./logger');

/**
 * 指定パスの破損ファイルをバックアップフォルダに移動
 * @param {string} filePath
 * @param {Error} error
 * @returns {Promise<string|null>} バックアップ先ファイルパス
 */
async function backupCorruptedFile(filePath, error) {
  try {
    const backupDir = path.join(path.dirname(filePath), 'backup_errors');
    await fs.mkdir(backupDir, { recursive: true });

    const backupPath = path.join(
      backupDir,
      `${path.basename(filePath)}.${Date.now()}.corrupted`
    );
    await fs.rename(filePath, backupPath);
    logger.info(`💾 破損ファイルをバックアップ: ${backupPath}`);
    logger.error(`[backupCorruptedFile] 破損ファイル "${filePath}" をバックアップしました。`, {
      errorMessage: error.message,
      stack: error.stack,
    });

    return backupPath;
  } catch (err) {
    logger.error(`❌ バックアップ失敗: ${filePath}`, { error: err });
    return null;
  }
}

/**
 * オブジェクトを整形して文字列化（2スペースJSON）
 * @param {Object} data
 * @returns {string}
 */
function prettyStringify(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * 指定されたJSONファイルを読み込む（存在しない/破損時は初期データで復元）
 * @param {string} filePath
 * @param {object} initialData
 * @returns {Promise<Object>}
 */
async function readJSON(filePath, initialData = {}) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.warn(`[readJSON] ファイル未発見 → 初期データ使用: ${filePath}`);
      return initialData;
    }
    if (err instanceof SyntaxError) {
      logger.error(`❌ JSONパースエラー: ${filePath}`, { error: err });
      await backupCorruptedFile(filePath, err);
      logger.warn(`[readJSON] パース不能 → 初期データで復元: ${filePath}`);
      return initialData;
    }
    logger.error(`❌ 読み込み失敗: ${filePath}`, { error: err });
    throw err;
  }
}

/**
 * オブジェクトをJSONファイルとして保存
 * @param {string} filePath
 * @param {Object} data
 * @returns {Promise<void>}
 */
async function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, prettyStringify(data), 'utf-8');
  } catch (err) {
    logger.error(`❌ 書き込み失敗: ${filePath}`, { error: err });
    throw err;
  }
}

/**
 * ギルドごとの初期データファイルを保証・返却
 * ファイルが存在しない場合は、渡された初期データで新規作成します。
 * @param {string} guildId
 * @param {object} initialData - 新規作成時に使用するデータ
 * @returns {Promise<string>} JSONファイルのパス
 */
async function ensureGuildJSON(guildId, initialData) {
  const dir = path.join('data', guildId);
  const filePath = path.join(dir, `${guildId}.json`);

  try {
    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(filePath);
    } catch {
      if (!initialData) {
        const err = new Error('Cannot create new guild file without initial data.');
        logger.error(`[ensureGuildJSON] initialData was not provided for new file creation: ${filePath}`, { error: err });
        throw err;
      }
      await fs.writeFile(filePath, prettyStringify(initialData), 'utf-8');
      logger.info(`✅ 新規JSONファイル作成: ${filePath}`);
    }

    return filePath;
  } catch (err) {
    logger.error(`❌ ensureGuildJSON: 初期化失敗: ${filePath}`, { error: err });
    throw err;
  }
}

module.exports = {
  readJSON,
  writeJSON,
  ensureGuildJSON,
};
