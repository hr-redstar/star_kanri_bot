// utils/totusuna_setti/buttons/edit.js

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlagsBitField,
} = require('discord.js');
const { totusunaConfigManager } = require('../totusunaConfigManager');
const { logAndReplyError } = require('../../errorHelper');

module.exports = {
  customIdStart: 'totusuna_setti:edit:',

  /**
   * 凸スナ本文編集モーダル表示
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    try {
      const uuid = interaction.customId.substring(module.exports.customIdStart.length);

      const instance = await totusunaConfigManager.getInstance(interaction.guildId, uuid);

      if (!instance) {
        return await interaction.reply({
          content: '⚠️ 指定された設定情報が見つかりません。',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`totusuna_edit_modal:${uuid}`)
        .setTitle('📘 凸スナ本文の編集');

      const input = new TextInputBuilder()
        .setCustomId('body')
        .setLabel('本文メッセージ（変更後）')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(instance.body || '');

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      await interaction.showModal(modal);
    } catch (err) {
      await logAndReplyError(interaction, err, 'モーダルの表示に失敗しました。');
    }
  },
};
