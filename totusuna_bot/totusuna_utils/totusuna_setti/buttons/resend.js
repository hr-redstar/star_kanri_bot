// utils/totusuna_setti/buttons/resend.js
const { MessageFlagsBitField } = require('discord.js');
const { totusunaConfigManager } = require('../totusunaConfigManager');
const { safeReply, safeDefer } = require('../../safeReply');
const { logAndReplyError } = require('../../errorHelper');
const { createErrorEmbed, createAdminRejectEmbed } = require('../../embedHelper');
const { buildTotusunaMessage } = require('../totusunaMessageHelper');
const { checkAdmin } = require('../../permissions/checkAdmin');
const logger = require('../../logger');

module.exports = {
  customIdStart: 'totusuna_setti:resend:',

  /**
   * 凸スナ再送信処理：設置メッセージを再投稿
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    logger.info(`[resend.js] 開始: ${interaction.customId} by ${interaction.user.tag}`);
    await safeDefer(interaction, { ephemeral: true });

    // 権限チェックは遅延応答の後に行います
    const isAdmin = await checkAdmin(interaction);
    if (!isAdmin) {
      return await safeReply(interaction, { embeds: [createAdminRejectEmbed()] });
    }

    const { guild, customId } = interaction;
    const uuid = customId.substring(module.exports.customIdStart.length);

    try {
      // configManagerを使用して安全にデータを取得
      const instance = await totusunaConfigManager.getInstance(guild.id, uuid);
      if (!instance || !instance.installChannelId) {
        return safeReply(interaction, { embeds: [createErrorEmbed('データエラー', '対象の凸スナデータが見つからないか、設置チャンネルが記録されていません。')] });
      }

      const channel = await guild.channels.fetch(instance.installChannelId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return safeReply(interaction, { embeds: [createErrorEmbed('チャンネルエラー', '対象チャンネルが存在しないか、Botがアクセスできません。')] });
      }

      // 古いメッセージを削除
      if (instance.messageId) {
        try {
          const oldMessage = await channel.messages.fetch(instance.messageId);
          await oldMessage.delete();
          logger.info(`[resend.js] 古いメッセージ削除完了: ${instance.messageId}`);
        } catch (err) {
          logger.warn(`[resend.js] 古いメッセージ削除失敗 or 既に削除済み: ${instance.messageId}`);
        }
      }

      // ヘルパー関数を使用してメッセージペイロードを構築
      const messagePayload = buildTotusunaMessage(instance);

      // 新しいメッセージを送信
      const sentMessage = await channel.send(messagePayload);
      logger.info(`[resend.js] 新規メッセージ投稿完了: ${sentMessage.id}`);

      // configManagerを使用して新しいメッセージIDを安全に保存
      await totusunaConfigManager.updateInstance(guild.id, uuid, { messageId: sentMessage.id });
      logger.info(`[resend.js] 新規メッセージIDを保存完了: ${uuid}`);

      await safeReply(interaction, { content: '📤 再送信しました。' });
      logger.info(`[resend.js] 完了: ${interaction.customId}`);

    } catch (err) {
      await logAndReplyError(interaction, err, '❌ 凸スナの再送信中にエラーが発生しました。');
    }
  }
};
