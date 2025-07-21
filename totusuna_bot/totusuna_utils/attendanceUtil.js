const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique record IDs

// 出退勤データ保存用のベースディレクトリ
const baseDir = path.resolve(__dirname, '../data');

// A simple in-memory lock to prevent race conditions on file writes
const fileLocks = new Map();

/**
 * Acquires a lock for a specific file path.
 * @param {string} filePath The path to the file to lock.
 */
async function acquireLock(filePath) {
  while (fileLocks.has(filePath)) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  fileLocks.set(filePath, true);
}

/**
 * Releases the lock for a specific file path.
 * @param {string} filePath The path to the file to unlock.
 */
function releaseLock(filePath) {
  fileLocks.delete(filePath);
}

/**
 * Gets the file path for today's attendance data.
 * @param {string} guildId
 * @returns {{filePath: string, dateStr: string, dir: string}}
 */
function getDailyAttendanceFilePath(guildId) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const dir = path.join(baseDir, guildId);
  const fileName = `attendance_${dateStr}.json`;
  return { filePath: path.join(dir, fileName), dateStr, dir };
}

/**
 * Reads the daily attendance file, creating it if it doesn't exist.
 * @param {string} guildId
 * @returns {Promise<{date: string, records: Array<object>}>}
 */
async function readOrCreateDailyAttendance(guildId) {
  const { filePath, dateStr, dir } = getDailyAttendanceFilePath(guildId);
  await fs.mkdir(dir, { recursive: true });
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return a new structure
      return { date: dateStr, records: [] };
    }
    // Other errors should be thrown
    throw error;
  }
}

/**
 * 出勤記録を保存
 * @param {string} guildId
 * @param {object} attendanceData
 */
async function saveWorkStart(guildId, attendanceData) {
  const { filePath } = getDailyAttendanceFilePath(guildId);
  await acquireLock(filePath);

  try {
    const fileData = await readOrCreateDailyAttendance(guildId);

    // 既存の出勤記録があるかチェック
    const isAlreadyWorking = fileData.records.some(
      record => record.userId === attendanceData.userId && !record.workEndTime
    );

    if (isAlreadyWorking) {
      return { success: false, reason: 'already_working' };
    }

    // 新しい出勤記録を追加
    fileData.records.push({
      ...attendanceData,
      recordId: uuidv4(), // Use UUID for a truly unique ID
      createdAt: new Date().toISOString()
    });

    await fs.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf8');
    return { success: true };

  } catch (error) {
    console.error('出勤記録保存エラー:', error);
    return { success: false, reason: 'save_error', error };
  } finally {
    releaseLock(filePath);
  }
}

/**
 * 退勤記録を保存
 * @param {string} guildId
 * @param {string} userId
 * @param {object} endData
 */
async function saveWorkEnd(guildId, userId, endData) {
  const { filePath } = getDailyAttendanceFilePath(guildId);
  await acquireLock(filePath);

  try {
    const fileData = await readOrCreateDailyAttendance(guildId);

    // 未退勤の出勤記録を検索
    const recordIndex = fileData.records.findIndex(
      record => record.userId === userId && !record.workEndTime
    );

    if (recordIndex === -1) {
      return { success: false, reason: 'no_work_start' };
    }

    // 退勤情報を記録
    const record = fileData.records[recordIndex];
    record.workEndTime = endData.workEndTime;
    record.workEndDisplay = endData.workEndDisplay;
    record.status = 'completed';

    await fs.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf8');
    return { success: true, record: fileData.records[recordIndex] };

  } catch (error) {
    console.error('退勤記録保存エラー:', error);
    return { success: false, reason: 'save_error', error };
  } finally {
    releaseLock(filePath);
  }
}

/**
 * 今日の出退勤状況を取得
 * @param {string} guildId
 */
async function getTodayAttendance(guildId) {
  return readOrCreateDailyAttendance(guildId).catch(error => {
    console.error('出退勤状況取得エラー:', error);
    const { dateStr } = getDailyAttendanceFilePath(guildId);
    return { date: dateStr, records: [] };
  });
}

/**
 * 勤務時間を計算
 * @param {Date} startTime
 * @param {Date} endTime
 */
function calculateWorkHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // 小数点1桁まで
}

/**
 * 時間帯別統計を生成
 * @param {Array} records
 */
function generateTimeSlotStats(records) {
  const stats = {
    '20時': 0,
    '21時': 0,
    '22時': 0,
    '今から': 0,
    '退勤済み': 0,
    '未退勤': 0
  };

  records.forEach(record => {
    // 時間帯別カウント
    if (record.workStartDisplay === '20時') stats['20時']++;
    else if (record.workStartDisplay === '21時') stats['21時']++;
    else if (record.workStartDisplay === '22時') stats['22時']++;
    else if (record.workStartDisplay.includes(':')) stats['今から']++;

    // 退勤状況カウント
    if (record.workEndTime) stats['退勤済み']++;
    else stats['未退勤']++;
  });

  return stats;
}

module.exports = {
  saveWorkStart,
  saveWorkEnd,
  getTodayAttendance,
  calculateWorkHours,
  generateTimeSlotStats
};
