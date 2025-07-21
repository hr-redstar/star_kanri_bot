// ファイル参考: commands/kpi_setti.js

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { MessageFlags } = require('discord.js');

const requireAdmin = require('../utils/permissions/requireAdmin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kpi_設定')
    .setDescription('KPI報告の案内メッセージを送信します'),

  execute: requireAdmin(async (interaction) => {
    const targetButton = new ButtonBuilder()
      .setCustomId('kpi_target_start_button')
      .setLabel('KPI目標')
      .setStyle(ButtonStyle.Primary);

    const reportButton = new ButtonBuilder()
      .setCustomId('kpi_report_start_button')
      .setLabel('KPI申請')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(targetButton, reportButton);

    await interaction.reply({
      content: 'KPI報告　目標設定・申請ボタン',
      components: [row],
      flags: MessageFlags.Ephemeral, // Discord.js v14以降はこちらを推奨
    });
  }),
};

