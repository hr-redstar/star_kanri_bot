// utils/totusuna_setti/selects/select_install_channel.js
const {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require('discord.js');
const { tempDataStore } = require('../../tempDataStore');
const { idManager } = require('../../idManager');
const { logAndReplyError } = require('../../errorHelper');

/**
 * Handles the selection of the main installation channel for a "Totsuna".
 * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
 */
async function actualHandler(interaction) {
  try {
    // Acknowledge the interaction to prevent it from failing.
    await interaction.deferUpdate();

    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const tempKey = `totusuna_install:${guildId}:${userId}`;

    // Retrieve the temporary data stored from the modal submission.
    const tempData = tempDataStore.get(tempKey);
    if (!tempData) {
      return await interaction.editReply({
        content: '⚠️ 設定データが見つかりませんでした。時間切れの可能性があります。最初からやり直してください。',
        components: [],
      });
    }

    // Get the selected channel ID and update the temporary data.
    tempData.installChannelId = interaction.values[0];
    tempDataStore.set(tempKey, tempData);

    // Create the next step: a select menu for replication channels.
    const replicateChannelSelect = new ChannelSelectMenuBuilder()
      .setCustomId(idManager.createSelectId('totusuna_setti', 'select_replicate_channels'))
      .setPlaceholder('連携するチャンネルを選択（複数可、任意）')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(0) // 0 selections is allowed.
      .setMaxValues(25);

    const row = new ActionRowBuilder().addComponents(replicateChannelSelect);

    await interaction.editReply({
      content: `✅ メインチャンネルとして <#${tempData.installChannelId}> を選択しました。\n次に、報告を連携するチャンネルを選択してください（任意）。`,
      components: [row],
    });

  } catch (error) {
    await logAndReplyError(interaction, error, '❌ チャンネル設定中にエラーが発生しました。');
  }
}

module.exports = {
  customId: 'totusuna_setti:select_install_channel',
  handle: actualHandler,
};