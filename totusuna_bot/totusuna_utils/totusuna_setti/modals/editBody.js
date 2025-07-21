// utils/totusuna_setti/modals/editBody.js

const { MessageFlagsBitField } = require('discord.js');
const { totusunaConfigManager } = require('../totusunaConfigManager');
const { updateTotusunaMessage } = require('../totusunaMessageHelper');
const { checkAdmin } = require('../../permissions/checkAdmin');
const { createAdminRejectEmbed } = require('../../embedHelper');
const { logAndReplyError } = require('../../errorHelper');

module.exports = {
  customIdStart: 'totusuna_edit_modal:',

  /**
   * 本文編集モーダル送信後処理
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handle(interaction) {
    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    // 権限チェックは遅延応答の後に行います
    const isAdmin = await checkAdmin(interaction);
    if (!isAdmin) {
      return await interaction.editReply({ embeds: [createAdminRejectEmbed()] });
    }

    const modalId = interaction.customId;
    const uuid = modalId.replace(module.exports.customIdStart, '');
    const guildId = interaction.guildId;
    const inputText = interaction.fields.getTextInputValue('body').trim();

    try {
      // Add validation for the input text
      if (!inputText) {
        return await interaction.editReply({ content: '⚠️ 本文を空にすることはできません。' });
      }

      const updateSuccess = await totusunaConfigManager.updateInstance(guildId, uuid, { body: inputText });

      if (!updateSuccess) {
        return await interaction.editReply({ content: '⚠️ 指定された設置データが存在しません。' });
      }

      // 更新されたインスタンスを取得し、Discord上のメッセージを更新します
      const instance = await totusunaConfigManager.getInstance(guildId, uuid);
      const messageUpdateResult = await updateTotusunaMessage(interaction.client, instance);
      if (!messageUpdateResult.success) {
        return await interaction.editReply({ content: '✅ 本文の保存には成功しましたが、設置メッセージの更新には失敗しました。' });
      }

      await interaction.editReply({ content: '✅ 本文を更新し、表示も変更しました。' });

    } catch (error) {
      await logAndReplyError(interaction, error, '本文の更新中に予期せぬエラーが発生しました。');
    }
  },
};
