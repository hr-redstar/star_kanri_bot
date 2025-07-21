// utils/totusuna_setti/modals/install.js
const {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  MessageFlagsBitField,
  ChannelType,
} = require('discord.js');
const { tempDataStore } = require('../../tempDataStore');
const { idManager } = require('../../idManager');
const { logAndReplyError } = require('../../errorHelper');
const { checkAdmin } = require('../../permissions/checkAdmin');
const { createAdminRejectEmbed } = require('../../embedHelper');

/**
 * "凸スナ設置" モーダルの送信を処理します。
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function actualHandler(interaction) {
  try {
    // タイムアウトを回避するため、即座に応答を遅延させます。
    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    // 権限チェックは必ず遅延応答の後に行います
    const isAdmin = await checkAdmin(interaction);
    if (!isAdmin) {
      return await interaction.editReply({ embeds: [createAdminRejectEmbed()] });
    }

    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    // このユーザーの操作のための一時的なデータを保存するための一意なキーを作成します。
    const tempKey = `totusuna_install:${guildId}:${userId}`;

    // モーダルフィールドからデータを抽出します。
    const inputData = {
      body: interaction.fields.getTextInputValue('body'),
      // タイトルはモーダルから削除されたため、デフォルト値を使用します。
      title: '📣 凸スナ報告受付中',
    };

    // 次のステップのために、抽出したデータをインメモリストアに保存します。
    tempDataStore.set(tempKey, {
      data: inputData,
      timestamp: Date.now(),
    });

    // ユーザーが設置チャンネルを選択するためのチャンネル選択メニューを作成します。
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId(idManager.createSelectId('totusuna_setti', 'select_install_channel'))
      .setPlaceholder('メッセージを設置するチャンネルを選択してください')
      .addChannelTypes(ChannelType.GuildText) // テキストチャンネルのみを許可
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(channelSelect);

    // 遅延応答を更新して、チャンネル選択メニューを表示します。
    await interaction.editReply({
      content:
        '✅ 本文を受け付けました。\n次に、この凸スナ案内を設置するチャンネルを選択してください。',
      components: [row],
    });
  } catch (error) {
    // エラーをログに記録し、ユーザーに通知します。
    await logAndReplyError(interaction, error, '❌ モーダルの処理中にエラーが発生しました。');
  }
}

module.exports = {
  // このIDは、ボタンハンドラのidManagerによって生成されたものと一致する必要があります。
  customId: 'totusuna_modal_install',
  handle: actualHandler, // requireAdminラッパーを削除
};