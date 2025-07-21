// utils/totusuna_config/selects/select.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { totusunaConfigManager } = require('../../totusuna_setti/totusunaConfigManager');
const { idManager } = require('../../idManager');
const { logAndReplyError } = require('../../errorHelper');
const { checkAdmin } = require('../../permissions/checkAdmin');
const { createAdminRejectEmbed } = require('../../embedHelper');
const { safeFollowUp } = require('../../safeReply');

/**
 * 設置済み凸スナを選択した後の処理
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 */
async function actualHandler(interaction) {
  try {
    // 応答を更新する準備ができたことをDiscordに伝えます
    await interaction.deferUpdate();

    // 権限チェックは遅延応答の後に行います
    const isAdmin = await checkAdmin(interaction);
    if (!isAdmin) {
      // deferUpdate後はfollowUpで応答するのが適切
      return await safeFollowUp(interaction, { embeds: [createAdminRejectEmbed()], ephemeral: true });
    }

    const { guildId, values } = interaction;
    const selectedUuid = values[0];

    const instance = await totusunaConfigManager.getInstance(guildId, selectedUuid);

    if (!instance) {
      return await interaction.editReply({
        content: '⚠️ 選択された凸スナデータが見つかりませんでした。削除された可能性があります。',
        embeds: [],
        components: [],
      });
    }

    // 詳細表示用のEmbedを作成
    const detailEmbed = new EmbedBuilder()
      .setTitle(`詳細: ${instance.title || '無題の凸スナ'}`)
      .setColor(0x00bfff)
      .addFields(
        { name: '本文', value: `\`\`\`${(instance.body || '(本文なし)').slice(0, 1000)}\`\`\`` },
        { name: 'ID', value: `\`${instance.id}\``, inline: true },
        { name: '設置チャンネル', value: `<#${instance.installChannelId}>`, inline: true },
        { name: '連携チャンネル数', value: `${instance.replicateChannelIds?.length || 0}件`, inline: true }
      )
      .setTimestamp(new Date(instance.createdAt));

    // 操作ボタンを作成
    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(idManager.createButtonId('totusuna_setti', 'edit', instance.id))
        .setLabel('本文編集')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✏️'),
      new ButtonBuilder()
        .setCustomId(idManager.createButtonId('totusuna_setti', 'resend', instance.id))
        .setLabel('再送信')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📤'),
      new ButtonBuilder()
        .setCustomId(idManager.createButtonId('totusuna_setti', 'delete', instance.id))
        .setLabel('削除')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
    );

    // 元のメッセージ（セレクトメニュー）を、詳細Embedと操作ボタンに置き換えます
    await interaction.editReply({
      embeds: [detailEmbed],
      components: [actionRow],
    });

  } catch (error) {
    await logAndReplyError(interaction, error, '❌ 凸スナ詳細の表示中にエラーが発生しました。');
  }
}

module.exports = {
  customId: 'totusuna_config:select',
  handle: actualHandler,
};