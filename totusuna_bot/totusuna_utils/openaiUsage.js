// utils/openaiUsage.js

const axios = require('axios');

const OPENAI_BILLING_URL = 'https://api.openai.com/v1/dashboard/billing/usage';

/**
 * OpenAI API の当月利用量を取得
 *
 * 管理者レベルの API キーが必要です。
 *
 * @param {string} apiKey - 組織管理者レベルの OpenAI API キー
 * @returns {Promise<{
 *   usage: string,
 *   raw: object
 * } | {
 *   error: true,
 *   message: string,
 *   status?: number
 * }>}
 */
async function getOpenAIUsage(apiKey) {
  const now = new Date();

  // UTC基準で当月1日から翌日までの期間を設定
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString().split('T')[0];

  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    .toISOString().split('T')[0];

  try {
    const response = await axios.get(`${OPENAI_BILLING_URL}?start_date=${startDate}&end_date=${endDate}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const usageInCents = response.data.total_usage;
    const usageInDollars = (usageInCents / 100).toFixed(2);

    return {
      usage: usageInDollars,
      raw: response.data,
    };
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.error?.message || error.message;

    console.error(`❌ OpenAI使用量取得エラー (${status || 'no status'}):`, message);

    return {
      error: true,
      message: '💸 使用量の取得に失敗しました（APIキーの権限が不足している可能性があります）。',
      status,
    };
  }
}

module.exports = {
  getOpenAIUsage,
};
