// commands/totusuna_csv.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { generateCsvForGuild } = require('../utils/totusuna_csv/csvGenerator');
const { logAndReplyError } = require('../utils/errorHelper');
const { createSuccessEmbed, createWarningEmbed, createAdminRejectEmbed } = require('../utils/embedHelper');
const { checkAdmin } = require('../utils/permissions/checkAdmin');

/**
 * The actual handler for the command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function actualHandler(interaction) {
  await interaction.deferReply({ ephemeral: true });

  // 権限チェックは遅延応答の後に行います
  const isAdmin = await checkAdmin(interaction);
  if (!isAdmin) {
    return await interaction.editReply({ embeds: [createAdminRejectEmbed()] });
  }

  const { guildId } = interaction;

  try {
    const result = await generateCsvForGuild(guildId);

    if (!result || result.fileCount === 0) {
      const embed = createWarningEmbed('データなし', '報告データが見つかりませんでした。');
      return await interaction.editReply({ embeds: [embed] });
    }

    const attachment = new AttachmentBuilder(result.buffer, {
      name: `凸スナ報告_${guildId}_${new Date().toISOString().split('T')[0]}.csv`,
    });

    const embed = createSuccessEmbed(
      'CSVファイル生成完了',
      `${result.fileCount}個の月次報告ファイルを結合しました。\n添付ファイルからダウンロードしてください。`
    );

    await interaction.editReply({
      embeds: [embed],
      files: [attachment],
    });

  } catch (error) {
    await logAndReplyError(interaction, error, '凸スナ報告CSVファイルの生成中にエラーが発生しました。');
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('totusuna_csv')
    .setDescription('すべての凸スナ報告データをCSVファイルとして一括で出力します（管理者専用）'),
  execute: actualHandler,
};