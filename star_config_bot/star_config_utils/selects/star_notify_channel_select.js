// utils/star_config/selects/star_notify_channel_select.js

const { configManager } = require('../../configManager');
const { idManager } = require('../../idManager');
const { logAndReplyError } = require('../../errorHelper');
const { checkAdmin } = require('../../permissions/checkAdmin');
const { createAdminRejectEmbed, createStarConfigEmbed } = require('../../embedHelper');
const { safeFollowUp } = require('../../safeReply');

async function actualHandler(interaction) {
  try {
    await interaction.deferUpdate();

    const isAdmin = await checkAdmin(interaction);
    if (!isAdmin) {
      return await safeFollowUp(interaction, {
        embeds: [createAdminRejectEmbed()],
        ephemeral: true,
      });
    }

    const { guild, guildId, values } = interaction;
    const selectedChannelId = values[0];

    // Get the current admin roles to rebuild the embed correctly
    const currentConfig = await configManager.getSectionConfig(guildId, 'star');
    const adminRoleIds = currentConfig?.adminRoleIds || [];

    // Update only the notifyChannelId
    await configManager.updateSectionConfig(guildId, 'star', {
      notifyChannelId: selectedChannelId,
    });

    const updatedEmbed = createStarConfigEmbed(guild, adminRoleIds, selectedChannelId);

    await interaction.editReply({
      embeds: [updatedEmbed],
      components: interaction.message.components, // Keep the same components
    });
  } catch (error) {
    await logAndReplyError(interaction, error, '⚠️ 通知チャンネルの設定更新中にエラーが発生しました。');
  }
}

module.exports = {
  customId: idManager.createSelectId('star_config', 'notify_channel_select'),
  handle: actualHandler,
};
