// utils/sendToMultipleChannels.js
const logger = require('./logger');

/**
 * 複数のテキストチャンネルに同一メッセージを並列で送信するユーティリティ。
 * 成功・失敗した送信に関する詳細な結果を返します。
 * @param {import('discord.js').Client} client - Discordクライアント
 * @param {string[]} channelIds - チャンネルIDの配列
 * @param {string | import('discord.js').MessagePayload | import('discord.js').MessageCreateOptions} message - 送信メッセージ
 * @returns {Promise<{sent: import('discord.js').Message[], failed: {channelId: string, reason: string}[]}>} 送信結果
 */
module.exports.sendToMultipleChannels = async (client, channelIds, message) => {
  if (!Array.isArray(channelIds) || channelIds.length === 0) {
    logger.warn('[sendToMultipleChannels] channelIds must be a non-empty array.');
    return { sent: [], failed: [] };
  }

  if (!client?.channels?.fetch) {
    logger.error('[sendToMultipleChannels] Invalid Discord client provided.');
    // すべてのチャンネルIDを失敗として返す
    const failed = channelIds.map(id => ({ channelId: id, reason: '無効な Discord クライアント' }));
    return { sent: [], failed };
  }

  // Promise.allSettled を使用して、すべての送信処理を並列で実行します。
  // これにより、1つのチャンネルへの送信が失敗しても、他のチャンネルへの送信は続行されます。
  const promises = channelIds.map(async (channelId) => {
    const channel = await client.channels.fetch(channelId).catch(() => null);

    if (!channel || !channel.isTextBased?.()) {
      // エラーを投げることで、Promise.allSettled が 'rejected' として扱います。
      throw new Error(`チャンネルが見つからないか、テキストベースではありません: ${channelId}`);
    }
    return channel.send(message);
  });

  const results = await Promise.allSettled(promises);

  const sent = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      sent.push(result.value);
      logger.info(`[sendToMultipleChannels] Successfully sent message to channel ${channelIds[index]}`);
    } else {
      failed.push({ channelId: channelIds[index], reason: result.reason.message });
      logger.error(`[sendToMultipleChannels] Failed to send message to channel ${channelIds[index]}`, {
        reason: result.reason.message,
      }
      );
    }
  });

  return { sent, failed };
};