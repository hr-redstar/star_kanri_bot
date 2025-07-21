// utils/openai.js

const OpenAI = require('openai');
const { ensureGuildJSON, readJSON } = require('./fileHelper');

/**
 * ギルドごとのChatGPT設定を読み込む
 * @param {string} guildId
 * @returns {Promise<Object>} config.chatgpt
 */
async function readGuildChatGPTConfig(guildId) {
  const filePath = await ensureGuildJSON(guildId);
  const config = await readJSON(filePath);
  return config.chatgpt || {};
}

/**
 * OpenAI API呼び出しの安全なラッパー
 * @param {Function} apiCall - OpenAI API呼び出し関数
 * @param {any} fallbackResponse - エラー時に返すデフォルトレスポンス
 * @returns {Promise<any>}
 */
async function safeOpenAICall(apiCall, fallbackResponse) {
  try {
    return await apiCall();
  } catch (error) {
    logger.error('OpenAI API Error', { message: error.message, code: error.code, error });

    let message = 'OpenAI APIエラーが発生しました。';
    switch (error.code) {
      case 'invalid_api_key':
        message = '無効なAPIキーが設定されています。';
        break;
      case 'insufficient_quota':
        message = 'APIの利用制限に達しました。';
        break;
      case 'rate_limit_exceeded':
        message = 'APIのリクエスト制限を超えました。';
        break;
    }

    return fallbackResponse || { error: true, message };
  }
}

/**
 * ChatGPT APIを呼び出す（ギルドごとの設定を適用）
 * @param {string} prompt - ユーザーからのプロンプト
 * @param {string} guildId - DiscordギルドID
 * @param {Object} [options] - 追加オプション（OpenAI APIのパラメータ）
 * @returns {Promise<any>}
 */
async function getChatCompletion(prompt, guildId, options = {}) {
  const chatgpt = await readGuildChatGPTConfig(guildId);

  if (!chatgpt.apiKey) {
    return { error: true, message: 'APIキーが設定されていません。' };
  }

  const openai = new OpenAI({ apiKey: chatgpt.apiKey });

  const defaultOptions = {
    model: chatgpt.model || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: chatgpt.maxTokens ?? 150,
    temperature: chatgpt.temperature ?? 0.7,
    ...options,
  };

  return await safeOpenAICall(
    () => openai.chat.completions.create(defaultOptions),
    {
      error: true,
      message: '🤖 現在、ChatGPT機能をご利用いただけません。',
    }
  );
}

module.exports = {
  getChatCompletion,
};
