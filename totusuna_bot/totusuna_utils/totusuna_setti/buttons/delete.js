// utils/totusuna_setti/buttons/delete.js

const { totusunaConfigManager } = require('../totusunaConfigManager');
const {
  createSuccessEmbed,
  createErrorEmbed,
  createAdminRejectEmbed,
} = require('../../embedHelper');
const { MessageFlagsBitField } = require('discord.js');
const { checkAdmin } = require('../../permissions/checkAdmin');
const { safeReply, safeDefer } = require('../../safeReply');
const logger = require('../../logger');
const { logAndReplyError } = require('../../errorHelper');

module.exports = {
  customIdStart: 'totusuna_setti:delete:',

  /**
   * Deletes a "Totsuna" instance, including its message and data entry.
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    logger.info(
      `[delete.js] 開始: ${interaction.customId} by ${interaction.user.tag}`
    );
    // safeDeferで3秒ルール回避
    await safeDefer(interaction, { flags: MessageFlagsBitField.Flags.Ephemeral });

    const isAdmin = await checkAdmin(interaction);
    if (!isAdmin) {
      return await safeReply(interaction, {
        embeds: [createAdminRejectEmbed()],
      });
    }

    const { guild, customId } = interaction;
    const uuid = customId.substring(module.exports.customIdStart.length);

    try {
      // インスタンス取得（messageId・channelId含む）
      const instance = await totusunaConfigManager.getInstance(guild.id, uuid);

      if (instance?.messageId && instance.installChannelId) {
        try {
          const channel = await guild.channels.fetch(instance.installChannelId);
          const message = await channel.messages.fetch(instance.messageId).catch(() => null);

          if (message) {
            await message.delete();
            logger.info(
              `[delete.js] 設置メッセージ削除完了 (guild: ${guild.id}, uuid: ${uuid})`
            );
          } else {
            logger.warn(
              `[delete.js] メッセージが存在しないため削除できません (guild: ${guild.id}, uuid: ${uuid})`
            );
          }
        } catch (err) {
          logger.warn(
            `[delete.js] メッセージ削除失敗 (guild: ${guild.id}, uuid: ${uuid})`,
            { error: err }
          );
          // チャンネルやメッセージ取得エラー → 致命的ではないので続行
        }
      }

      const success = await totusunaConfigManager.removeInstance(guild.id, uuid);

      if (success) {
        logger.info(
          `[delete.js] DBからインスタンス削除成功 (guild: ${guild.id}, uuid: ${uuid})`
        );
        await safeReply(interaction, {
          embeds: [createSuccessEmbed('削除完了', '凸スナの設置データを削除しました。')],
        });
      } else {
        logger.warn(
          `[delete.js] DBからインスタンス削除失敗、または該当なし (guild: ${guild.id}, uuid: ${uuid})`
        );
        await safeReply(interaction, {
          embeds: [
            createErrorEmbed(
              '削除失敗',
              '指定された凸スナが見つかりませんでした。データが既に削除されている可能性があります。'
            ),
          ],
        });
      }
    } catch (err) {
      await logAndReplyError(interaction, err, '凸スナの削除中に予期せぬエラーが発生しました。');
    }
    logger.info(`[delete.js] 完了: ${interaction.customId}`);
  },
};
