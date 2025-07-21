// utils/storage.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// 環境変数から設定を取得
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const KEY_FILE = process.env.GCP_CREDENTIALS_JSON || 'gcp-service-account.json';

// 設定確認
const isKeyFileValid = fs.existsSync(KEY_FILE);
const isGCSConfigured = Boolean(BUCKET_NAME && PROJECT_ID && isKeyFileValid);

// 警告ログ（初期化時に1度だけ表示）
if (!isGCSConfigured) {
  logger.warn('[storage] ⚠️ GCS設定が不完全なため、ストレージ機能は無効化されます。');
}

// GCSストレージインスタンスとバケット
const storage = isGCSConfigured ? new Storage({
  projectId: PROJECT_ID,
  keyFilename: KEY_FILE,
}) : null;

const bucket = isGCSConfigured ? storage.bucket(BUCKET_NAME) : null;

/**
 * GCSにファイルをアップロード
 * @param {string} localFilePath - ローカルファイルの絶対パス
 * @param {string} destinationPath - GCS保存パス（例: guildId/YYYY-MM-DD/filename.xlsx）
 * @returns {Promise<boolean>}
 */
async function uploadFile(localFilePath, destinationPath) {
  if (!isGCSConfigured) {
    logger.warn('[storage] ストレージが未構成のため uploadFile はスキップされました');
    return false;
  }

  if (!fs.existsSync(localFilePath)) {
    logger.warn(`[storage] ⚠️ アップロード対象のファイルが存在しません: ${localFilePath}`);
    return false;
  }

  try {
    await bucket.upload(localFilePath, {
      destination: destinationPath,
      gzip: true,
      metadata: {
        cacheControl: 'no-cache',
      },
    });
    logger.info(`[storage] ✅ アップロード成功: ${destinationPath}`);
    return true;
  } catch (error) {
    logger.error(`[storage] ❌ アップロード失敗: ${destinationPath}`, { error });
    return false;
  }
}

/**
 * GCSからファイルをダウンロード
 * @param {string} destinationPath - GCS上のファイルパス
 * @param {string} localFilePath - ローカル保存先パス
 * @returns {Promise<boolean>}
 */
async function downloadFile(destinationPath, localFilePath) {
  if (!isGCSConfigured) {
    logger.warn('[storage] ストレージが未構成のため downloadFile はスキップされました');
    return false;
  }

  try {
    await bucket.file(destinationPath).download({ destination: localFilePath });
    logger.info(`[storage] ✅ ダウンロード成功: ${destinationPath}`);
    return true;
  } catch (error) {
    logger.warn(`[storage] ⚠️ ダウンロード失敗（存在しない可能性あり）: ${destinationPath}`);
    return false;
  }
}

module.exports = {
  uploadFile,
  downloadFile,
  isGCSConfigured,
};
