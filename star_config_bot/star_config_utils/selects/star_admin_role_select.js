// utils/star_config/selects/star_admin_role_select.js

const { configManager } = require('../../configManager');
const { logAndReplyError } = require('../../errorHelper');
const { createStarConfigEmbed, createAdminRejectEmbed } = require('../../embedHelper');
const { checkAdmin } = require('../../permissions/checkAdmin');
const { safeFollowUp } = require('../../safeReply');
const { idManager } = require('../../idManager');

async function actualHandler(interaction) {
  try {
    await interaction.deferUpdate();

    const isAdmin = await checkAdmin(interaction);
    if (!isAdmin) {
      return await safeFollowUp(interaction, { embeds: [createAdminRejectEmbed()], ephemeral: true });
    }

    const { guild, guildId, values: selectedRoleIds } = interaction;

    const currentConfig = await configManager.getSectionConfig(guildId, 'star');
    const notifyChannelId = currentConfig?.notifyChannelId ?? null;

    await configManager.updateSectionConfig(guildId, 'star', { adminRoleIds: selectedRoleIds });

    const updatedEmbed = createStarConfigEmbed(guild, selectedRoleIds, notifyChannelId);

    await interaction.editReply({
      embeds: [updatedEmbed],
      components: interaction.message.components,
    });

  } catch (error) {
    await logAndReplyError(interaction, error, '⚠️ ロール設定の更新中にエラーが発生しました。');
  }
}

module.exports = {
  customId: idManager.createSelectId('star_config', 'admin_role_select'),
  handle: actualHandler,
};
