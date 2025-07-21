const { EmbedBuilder } = require('discord.js');
const { totusunaConfigManager } = require('../totusunaConfigManager');
const { sendToMultipleChannels } = require('../../sendToMultipleChannels');
const { writeTotusunaReport } = require('../../writeTotusunaReport');
const { safeReply } = require('../../safeReply');
const { logAndReplyError } = require('../../errorHelper');

/**
 * "凸スナ報告" モーダルの送信を処理します。
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function actualHandler(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const { guildId, customId, fields, user } = interaction;

    // customIdを解析して、UUID、組数、人数を抽出します。
    // 形式: totusuna_report_modal:submit:UUID:team-X:member-Y
    const parts = customId.split(':');
    const uuid = parts[2];
    const teamPart = parts.find(p => p.startsWith('team-'));
    const memberPart = parts.find(p => p.startsWith('member-'));

    if (!uuid || !teamPart || !memberPart) {
      return await logAndReplyError(interaction, `モーダルIDの形式が不正です: ${customId}`, '❌ 報告の送信に失敗しました。ボタンが無効か、古いバージョンの可能性があります。');
    }

    const groupValue = teamPart.substring('team-'.length);
    const nameValue = memberPart.substring('member-'.length);

    // モーダルから入力データを取得し、customIdからの情報と結合します。
    const reportData = {
      username: user.tag,
      date: new Date().toISOString(),
      group: `${groupValue}組`,
      name: `${nameValue}名`,
      table1: fields.getTextInputValue('table1') || '',
      table2: fields.getTextInputValue('table2') || '',
      detail: fields.getTextInputValue('detail') || '',
    };

    const instance = await totusunaConfigManager.getInstance(guildId, uuid);
    if (!instance) {
      return await logAndReplyError(interaction, `凸スナインスタンスが見つかりません (UUID: ${uuid})`, '❌ 報告の送信に失敗しました。元の報告メッセージが削除された可能性があります。');
    }

    const reportEmbed = new EmbedBuilder()
      .setTitle(`📝 凸スナ報告がありました`)
      .setColor(0x3498db)
      .addFields(
        { name: '報告者', value: user.toString(), inline: true },
        { name: '報告日時', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        { name: '組数/人数', value: `${reportData.group} / ${reportData.name}`, inline: false },
      )
      .setTimestamp();

    if (reportData.table1 || reportData.table2) {
      reportEmbed.addFields({ name: '卓情報', value: `卓1: ${reportData.table1 || 'なし'}\n卓2: ${reportData.table2 || 'なし'}`, inline: false });
    }
    if (reportData.detail) {
      reportEmbed.addFields({ name: '詳細', value: reportData.detail, inline: false });
    }

    const allChannelIds = [instance.installChannelId, ...(instance.replicateChannelIds || [])].filter(Boolean);
    if (allChannelIds.length > 0) {
      await sendToMultipleChannels(interaction.client, allChannelIds, { embeds: [reportEmbed] });
    }

    const yearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await writeTotusunaReport(guildId, yearMonth, reportData);

    await safeReply(interaction, {
      content: '✅ 報告が送信されました。ご協力ありがとうございます！',
      ephemeral: true,
    });

  } catch (error) {
    await logAndReplyError(interaction, error, '❌ 報告の処理中にエラーが発生しました。');
  }
}

module.exports = {
  customIdStart: 'totusuna_report_modal:submit:',
  handle: actualHandler,
};