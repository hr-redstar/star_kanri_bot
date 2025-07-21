const { EmbedBuilder, DiscordAPIError, MessageFlagsBitField } = require('discord.js');
const { safeReply } = require('./safeReply');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

async function logAndReplyError(interaction, error, userMessage) {
  const errorId = uuidv4();
  const actualError = error instanceof Error ? error : new Error(String(error));

  const interactionDetails = {
    errorId,
    guildId: interaction.guild?.id,
    channelId: interaction.channel?.id,
    userId: interaction.user?.id,
    commandName: interaction.isCommand() ? interaction.commandName : 'N/A',
    customId:
      interaction.isMessageComponent() || interaction.isModalSubmit()
        ? interaction.customId
        : 'N/A',
  };

  if (actualError instanceof DiscordAPIError) {
    logger.error('Discord API Error', {
      ...interactionDetails,
      message: actualError.message,
      code: actualError.code,
      status: actualError.status,
      method: actualError.method,
      url: actualError.url,
      stack: actualError.stack,
    });
  } else {
    logger.error('Unhandled Error', {
      ...interactionDetails,
      message: actualError.message,
      stack: actualError.stack,
    });
  }

  const errorEmbed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('❌ エラーが発生しました')
    .setDescription(userMessage)
    .setFooter({ text: `サポート用ID: ${errorId}` });

  try {
    await safeReply(interaction, {
      embeds: [errorEmbed],
      flags: MessageFlagsBitField.Ephemeral, // ここでflags:64指定
    });
  } catch (replyError) {
    logger.error('[logAndReplyError] safeReply で失敗', { error: replyError, errorId });
  }
}

module.exports = { logAndReplyError };
