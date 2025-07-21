// commands/totusuna_setti.js

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlagsBitField,
} = require('discord.js');
const { safeReply, safeDefer } = require('../utils/safeReply');
const { checkAdmin } = require('../utils/permissions/checkAdmin');
const { logAndReplyError } = require('../utils/errorHelper');
const { idManager } = require('../utils/idManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('totusuna_setti')
    .setDescription('凸スナの新規設置を行います（管理者専用）'),

  async execute(interaction) {
    try {
      // 遅延応答を確保（Unknown interaction対策）
      await safeDefer(interaction, { flags: MessageFlagsBitField.Flags.Ephemeral });

      // 管理者チェック
      const isAdmin = await checkAdmin(interaction);
      if (!isAdmin) {
        return await safeReply(interaction, {
          content: '❌ このコマンドは管理者のみ使用可能です。',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
      }

      // Embed作成
      const embed = new EmbedBuilder()
        .setTitle('📌 凸スナ 新規設置')
        .setDescription([
          '🆕 新しい凸スナ報告メッセージを設置するには、「新規設置」ボタンを押してください。',
          '',
          '**💡 ヒント**',
          '• 設置済みの凸スナを管理するには `/凸スナ設定` を使用してください。',
          '• 報告データをCSVで出力するには `/凸スナcsv` を使用してください。'
        ].join('\n'))
        .setColor(0x2ecc71);

      // ボタン構成（1列）
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(idManager.createButtonId('totusuna_setti', 'install'))
          .setLabel('新規設置')
          .setEmoji('🆕')
          .setStyle(ButtonStyle.Primary),
      );

      // 応答送信
      await safeReply(interaction, {
        embeds: [embed],
        components: [row1],
      });

    } catch (error) {
      await logAndReplyError(interaction, error, '凸スナ設置UIの表示中にエラーが発生しました。');
    }
  }
};
