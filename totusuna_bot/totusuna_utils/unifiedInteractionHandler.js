const { MessageFlagsBitField } = require('discord.js');
const logger = require('./logger');

// 各機能のハンドラ群を読み込みます。
// 新しい機能（例: star_config）を追加する際は、ここに追記します。
const totusunaHandlers = require('./totusuna_setti');
// const starConfigHandlers = require('./star_config'); // 将来の拡張例

// 検索するハンドラ群のリスト。順番が重要になる場合があります。
const featureHandlers = [
  totusunaHandlers,
  // starConfigHandlers,
];

class UnifiedInteractionHandler {
  /**
   * すべての非コマンドインタラクションを処理する中央ルーター。
   * @param {import('discord.js').Interaction} interaction
   */
  async handleInteraction(interaction) {
    const handler = this.findHandler(interaction);

    if (handler) {
      await handler.handle(interaction);
    } else {
      logger.warn(`[UnifiedHandler] No handler found for interaction`, {
        customId: interaction.customId,
        user: interaction.user.tag,
        type: interaction.type,
      });
      // ユーザーに応答がない場合、コンポーネントが無効であることを通知します。
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'この操作は現在無効か、期限切れです。',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        }).catch(() => {});
      }
    }
  }

  /**
   * インタラクションに対応するハンドラを検索します。
   * @param {import('discord.js').Interaction} interaction
   * @returns {object|null}
   */
  findHandler(interaction) {
    const type = interaction.isButton()
      ? 'buttons'
      : interaction.isModalSubmit()
      ? 'modals'
      : interaction.isStringSelectMenu()
      ? 'selects'
      : null;

    if (!type) return null;

    for (const feature of featureHandlers) {
      const handlerFinder = feature[type]; // 例: totusunaHandlers.buttons
      if (handlerFinder) {
        const handler = handlerFinder(interaction.customId);
        if (handler) return handler;
      }
    }
    return null;
  }
}

module.exports = {
  unifiedHandler: new UnifiedInteractionHandler(),
};