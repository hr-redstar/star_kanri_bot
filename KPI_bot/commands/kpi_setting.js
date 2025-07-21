const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const requireAdmin = require('../utils/permissions/requireAdmin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kpi_setting')
    .setDescription('KPI設定用のモーダルを表示します'),

  execute: requireAdmin(async (interaction) => {
    // モーダル作成
    const modal = new ModalBuilder()
      .setCustomId('kpi_setting_modal')
      .setTitle('KPI設定');

    const newShopInput = new TextInputBuilder()
      .setCustomId('newShop')
      .setLabel('店舗名（カンマ区切りで複数追加可能）')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const targetDateInput = new TextInputBuilder()
      .setCustomId('targetDate')
      .setLabel('対象日 (YYYY-MM-DD)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const targetCountInput = new TextInputBuilder()
      .setCustomId('targetCount')
      .setLabel('目標人数')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // アクションロウにテキスト入力をセット
    const row1 = new ActionRowBuilder().addComponents(newShopInput);
    const row2 = new ActionRowBuilder().addComponents(targetDateInput);
    const row3 = new ActionRowBuilder().addComponents(targetCountInput);

    modal.addComponents(row1, row2, row3);

    // モーダル表示
    await interaction.showModal(modal);
  }),
};
