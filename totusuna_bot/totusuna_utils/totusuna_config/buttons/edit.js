// utils/totusuna_config/buttons/edit.js

const fs = require('fs');
const path = require('path');
const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlagsBitField
} = require('discord.js');

module.exports = {
  customId: 'totusuna_config:設定を編集',

  /**
   * 凸スナ本文の編集モーダル表示
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {string} uuid
   */
  async handle(interaction, uuid) {
    const guildId = interaction.guildId;
    const dataPath = path.join(__dirname, '../../../data', guildId, `${guildId}.json`);

    if (!fs.existsSync(dataPath)) {
      return await interaction.reply({
        content: '⚠️ データファイルが見つかりません。',
        flags: MessageFlagsBitField.Flags.Ephemeral
      });
    }

    let json;
    try {
      json = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (e) {
      return await interaction.reply({
        content: '⚠️ データファイルの読み込みに失敗しました。',
        flags: MessageFlagsBitField.Flags.Ephemeral
      });
    }

    const instance = json.totusuna?.instances?.find(i => i.id === uuid);

    if (!instance) {
      return await interaction.reply({
        content: '⚠️ 指定された設置が見つかりません。',
        flags: MessageFlagsBitField.Flags.Ephemeral
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`totusuna_config_edit_modal_${uuid}`)
      .setTitle('📄 本文の修正');

    const bodyInput = new TextInputBuilder()
      .setCustomId('body')
      .setLabel('本文内容')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(instance.body || '')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(bodyInput));

    await interaction.showModal(modal);
  }
};
