// utils/totusuna_setti/buttons/install.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { idManager } = require('../../idManager');

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function actualHandler(interaction) {
  const modal = new ModalBuilder()
    .setCustomId(idManager.createModalId('totusuna_setti', 'install'))
    .setTitle('凸スナ 新規設置');

  const titleInput = new TextInputBuilder()
    .setCustomId('title')
    .setLabel('タイトル')
    .setPlaceholder('例: 7/20(土) クラン戦の凸スナ報告')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const bodyInput = new TextInputBuilder()
    .setCustomId('body')
    .setLabel('メッセージ本文')
    .setPlaceholder('報告ボタンの上に表示されるメッセージを入力してください。\n例: 報告ボタンで「何組」「何人」かを入力！')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const row1 = new ActionRowBuilder().addComponents(titleInput);
  const row2 = new ActionRowBuilder().addComponents(bodyInput);

  modal.addComponents(row1, row2);

  await interaction.showModal(modal);
}

module.exports = {
  customId: 'totusuna_setti:install',
  handle: actualHandler,
};