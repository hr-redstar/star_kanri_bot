const path = require('path');
const fs = require('fs/promises');

/**
 * KPI実績報告をCSVファイルに追記します
 * @param {string} guildId ギルドID
 * @param {object} entry 報告内容 { username, shopName, reportDate, details }
 */
async function writeKpiReport(guildId, entry) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dir = path.join(__dirname, `../data/${guildId}`);
  const csvPath = path.join(dir, `${guildId}-${yearMonth}-KPI報告.csv`);

  await fs.mkdir(dir, { recursive: true });

  const headers = ['報告者', '報告時刻', '店舗名', '対象日', '実績詳細'];
  const values = [
    entry.username,
    now.toISOString(),
    entry.shopName,
    entry.reportDate,
    entry.details.replace(/"/g, '""'), // CSV用にダブルクォートをエスケープ
  ];

  const csvLine = `${values.map((v) => `"${String(v)}"`).join(',')}\n`;

  try {
    await fs.access(csvPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(csvPath, `${headers.join(',')}\n`, 'utf8');
    } else {
      throw error;
    }
  }

  await fs.appendFile(csvPath, csvLine, 'utf8');
}

module.exports = {
  writeKpiReport,
};