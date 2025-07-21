// utils/spreadsheetHandler.js
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { uploadFile, downloadFile } = require('./storage'); // GCS連携用

/**
 * GCS用ファイルパスを生成（例: 1234567890123/1234567890123-2025-07-凸スナ報告.xlsx） * @param {string} guildId
 * @param {string} suffix
 * @returns {string}
 */
function getGCSPath(guildId, suffix = '') {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `${guildId}/${guildId}-${ym}${suffix ? `-${suffix}` : ''}.xlsx`;
}

/**
 * ローカル保存パスを取得（存在しない場合はディレクトリ作成） * @param {string} guildId
 * @param {string} suffix
 * @returns {string}
 */
function getLocalSpreadsheetPath(guildId, suffix = '') {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const fileName = `${guildId}-${ym}${suffix ? `-${suffix}` : ''}.xlsx`;
  const dir = path.join(__dirname, '../data', guildId);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return path.join(dir, fileName);
}

/**
 * ワークブックを読み込み or 新規作成（GCS同期込み）
 * @param {string} guildId
 * @param {string} suffix
 * @param {string} sheetName
 * @returns {Promise<{ workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, localPath: string, gcsPath: string }>}
 */
async function loadOrCreateWorkbook(guildId, suffix = '', sheetName = '報告') {
  const localPath = getLocalSpreadsheetPath(guildId, suffix);
  const gcsPath = getGCSPath(guildId, suffix);

  // GCSから最新ファイルをダウンロード（存在しない場合はスキップ）  await downloadFile(gcsPath, localPath);

  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(localPath)) {
    await workbook.xlsx.readFile(localPath);
  }

  let sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(['日付', '何星', '何名', '1凸', '2凸', '3凸', '持越', '詳細', '名前']);
  }

  return { workbook, sheet, localPath, gcsPath };
}

/**
 * 保存後、GCSにアップロードして同期
 * @param {ExcelJS.Workbook} workbook
 * @param {string} localPath
 * @param {string} gcsPath
 */
async function saveAndSyncWorkbook(workbook, localPath, gcsPath) {
  await workbook.xlsx.writeFile(localPath);
  await uploadFile(localPath, gcsPath);
}

module.exports = {
  getLocalSpreadsheetPath,
  getGCSPath,
  loadOrCreateWorkbook,
  saveAndSyncWorkbook,
};
