const path = require('path');
const fs = require('fs/promises');

/**
 * 凸スナ報告をCSVファイルに追記します
 * @param {string} guildId ギルドID
 * @param {string} yearMonth 年月 (例: "2025-07")
 * @param {object} entry 報告内容
 */
async function writeTotusunaReport(guildId, yearMonth, entry) {
  const dir = path.join(__dirname, `../data/${guildId}`);
  const csvPath = path.join(dir, `${guildId}-${yearMonth}-凸スナ報告.csv`);

  // 非同期にディレクトリを作成
  await fs.mkdir(dir, { recursive: true });

  // 日付が未定義なら現在時刻で補完
  const dateStr = entry.date || new Date().toISOString();

  const headers = ['報告者', '日時', '組数', '名前', '卓1', '卓2', '卓3', '卓4', '詳細'];
  const values = [
    entry.username,
    dateStr,
    entry.group,
    entry.name,
    entry.table1 || '',
    entry.table2 || '',
    entry.table3 || '',
    entry.table4 || '',
    entry.detail || ''
  ];

  const csvLine = `${values.map(v => `"${v}"`).join(',')}
`;

  try {
    // ファイルの存在確認を非同期で行い、なければヘッダーを書き込む
    await fs.access(csvPath);
  } catch (error) {
    // ファイルが存在しない場合(ENOENT)のみヘッダーを書き込む
    if (error.code === 'ENOENT') {
      await fs.writeFile(csvPath, `${headers.join(',')}\n`, 'utf8');
    } else {
      throw error; // その他のエラーは再スロー
    }
  }

  // 非同期に追記
  await fs.appendFile(csvPath, csvLine, 'utf8');
}

module.exports = {
  writeTotusunaReport, // 関数名を統一
};
