// utils/totusuna_setti/selects/select_replicate_channels.js
const { ChannelType } = require('discord.js');
const { tempDataStore } = require('../../tempDataStore');
const { idManager } = require('../../idManager');
const { totusunaConfigManager } = require('../totusunaConfigManager');
const { logAndReplyError } = require('../../errorHelper');
const { sendToMultipleChannels } = require('../../sendToMultipleChannels');
const { safeDefer } = require('../../safeReply');
const { buildTotusunaMessage } = require('../totusunaMessageHelper');
const { checkAdmin } = require('../../permissions/checkAdmin');
const { createAdminRejectEmbed } = require('../../embedHelper');

/**
 * 連携チャンネルの選択を処理し、凸スナの設置を完了させます。
 * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
 */
async function actualHandler(interaction) {
  // 最終ステップでファイルI/Oや複数APIコールがあるため、安全に遅延応答します。
  await safeDefer(interaction, { ephemeral: true });

  // 権限チェックは必ず遅延応答の後に行います
  const isAdmin = await checkAdmin(interaction);
  if (!isAdmin) {
    return await interaction.editReply({ embeds: [createAdminRejectEmbed()] });
  }

  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const tempKey = `totusuna_install:${guildId}:${userId}`;

  try {
    // 一時データを取得します。
    const tempData = tempDataStore.get(tempKey);
    if (!tempData || !tempData.installChannelId) {
      return await interaction.editReply({
        content:
          '⚠️ 設定データが見つからないか、不完全です。時間切れの可能性がありますので、最初からやり直してください。',
        components: [],
      });
    }

    // 選択された連携チャンネルIDを取得します。
    const replicateChannelIds = interaction.values;

    // 設置先チャンネルを取得し、検証します。
    const installChannel = await interaction.guild.channels
      .fetch(tempData.installChannelId)
      .catch(() => null);
    if (!installChannel || installChannel.type !== ChannelType.GuildText) {
      return await interaction.editReply({
        content: '❌ 設置先チャンネルが見つからないか、テキストチャンネルではありません。',
      });
    }

    // 凸スナの一意なIDを生成します。
    const instanceId = idManager.generateUUID();

    // 保存するインスタンスデータを構築します。
    const instanceData = {
      id: instanceId,
      ...tempData.data,
      installChannelId: installChannel.id,
      replicateChannelIds: replicateChannelIds,
      messageId: null, // この時点ではまだ不明
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    // ヘルパーを使用してメッセージペイロードを構築します。
    const messagePayload = buildTotusunaMessage(instanceData);

    // メインチャンネルと連携チャンネルのIDを結合します。
    const allChannelIds = [installChannel.id, ...replicateChannelIds];

    // sendToMultipleChannels ユーティリティを使用して、すべてのチャンネルに一括送信します。
    const { sent, failed } = await sendToMultipleChannels(
      interaction.client,
      allChannelIds,
      messagePayload
    );

    // メインの設置チャンネルに投稿されたメッセージのIDを取得して、データに追加します。
    const mainMessage = sent.find(m => m.channel.id === installChannel.id);
    if (mainMessage) {
      instanceData.messageId = mainMessage.id;
    }
    
    // totusunaConfigManagerを使用して、すべての設定を永続化します。
    await totusunaConfigManager.addInstance(guildId, instanceData);

    // ユーザーへの完了メッセージを構築します。
    let replyContent = `✅ 凸スナを <#${installChannel.id}> に設置しました！`;
    if (replicateChannelIds.length > 0) {
      replyContent += `\n連携チャンネル: ${replicateChannelIds.map(id => `<#${id}>`).join(', ')}`;
    }
    if (failed.length > 0) {
      replyContent += `\n\n⚠️ **警告:** 一部のチャンネルへの送信に失敗しました: ${failed
        .map(f => `<#${f.channelId}>`)
        .join(', ')}`;
    }

    // 完了メッセージをユーザーに送信します。
    await interaction.editReply({
      content: replyContent,
      components: [],
    });
  } catch (error) {
    await logAndReplyError(interaction, error, '❌ 凸スナの設置中にエラーが発生しました。');
  } finally {
    // 処理が完了または失敗したあと、必ず一時データを削除します。
    tempDataStore.delete(tempKey);
  }
}

module.exports = {
  customId: 'totusuna_setti:select_replicate_channels',
  handle: actualHandler,
};