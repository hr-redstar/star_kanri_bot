// utils/totusuna_csv/csvGenerator.js
const fs = require('fs/promises');
const path = require('path');

/**
 * 指定されたギルドのすべての報告書CSVファイルを結合して、単一のバッファを生成します。
 * @param {string} guildId ギルドID
 * @returns {Promise<{buffer: Buffer, fileCount: number} | null>} CSVバッファとファイル数を含むオブジェクト、またはファイルが見つからない場合はnull
 */
async function generateCsvForGuild(guildId) {
  const guildDataPath = path.join(__dirname, '..', '..', 'data', guildId);
  let allCsvContent = '';
  let fileCount = 0;
  let header = '';

  try {
    const files = await fs.readdir(guildDataPath);
    const csvFiles = files.filter(file => file.endsWith('-凸スナ報告.csv'));

    if (csvFiles.length === 0) {
      return null;
    }

    // ファイルを時系列順にソート
    csvFiles.sort();

    for (const file of csvFiles) {
      const filePath = path.join(guildDataPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');

      if (lines.length > 0) {
        if (!header) {
          header = lines[0];
          allCsvContent += header + '\n';
        }
        // 2つ目以降のファイルではヘッダー行をスキップ
        const contentLines = lines.slice(1);
        if (contentLines.length > 0) {
          allCsvContent += contentLines.join('\n') + '\n';
        }
        fileCount++;
      }
    }

    if (fileCount === 0) return null;

    return {
      buffer: Buffer.from(allCsvContent, 'utf-8'),
      fileCount: fileCount,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`[csvGenerator] ギルド ${guildId} のデータディレクトリが見つかりません。`);
      return null;
    }
    console.error(`[csvGenerator] ギルド ${guildId} のCSV生成中にエラー:`, error);
    throw error;
  }
}

module.exports = { generateCsvForGuild };