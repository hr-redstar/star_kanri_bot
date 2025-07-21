// utils/safeReply.js
const { MessageFlagsBitField } = require('discord.js');
const logger = require('./logger');

/**
 * インタラクションに安全に応答または応答を編集します。
 * `reply()`, `deferReply()`, `deferUpdate()` のいずれかが既に行われている場合、`editReply()` を使用して応答を更新します。
 * まだ応答がない場合は、`reply()` を使用して最初の応答を送信します。
 * この関数は、インタラクションに対して単一の最終的な応答を提供することを目的としています。
 * @param {import('discord.js').Interaction} interaction - 対象のインタラクション
 * @param {import('discord.js').InteractionReplyOptions} options - 返信内容
 */
async function safeReply(interaction, options) {
  try {
    // interaction.replied: 既に reply() で応答済み
    // interaction.deferred: deferReply() で遅延応答済み
    // どちらの場合も editReply() を使って応答メッセージを更新/設定します。
    // followUp() は新しいメッセージを送信するため、この関数の目的とは異なります。
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(options);
    } else {
      await interaction.reply(options);
    }
  } catch (error) {
    // "Unknown interaction"エラーなどを捕捉し、Botのクラッシュを防ぎます。
    logger.error(`[safeReply] Failed to reply to interaction`, {
      message: error.message,
      stack: error.stack,
      interactionId: interaction?.id,
      customId: interaction?.customId,
      user: interaction?.user?.tag,
    });
  }
}

/**
 * インタラクションを安全に遅延応答（defer）します。
 * この関数は、応答に3秒以上かかる可能性があるコマンドの最初に呼び出します。
 * 既に遅延または応答済みの場合は、重複した応答を避けるために何もしません。
 * @param {import('discord.js').Interaction} interaction - 対象のインタラクション
 * @param {object} [options] - `ephemeral: true` または `flags` を含むオプション
 */
async function safeDefer(interaction, options = {}) {
  try {
    if (interaction.deferred || interaction.replied) {
      // 既に処理されている場合は何もしない
      return;
    }

    const deferOptions = {};
    if ('flags' in options) {
      // flagsプロパティを優先
      deferOptions.flags = options.flags;
    } else if (options.ephemeral === true) {
      deferOptions.flags = MessageFlagsBitField.Flags.Ephemeral;
    }

    await interaction.deferReply(deferOptions);
  } catch (error) {
    logger.error(`[safeDefer] Failed to defer reply`, {
      message: error.message,
      stack: error.stack,
      interactionId: interaction?.id,
      customId: interaction?.customId,
    });
    // Re-throw the error so the calling function knows the deferral failed
    // and can handle it appropriately (e.g., by stopping execution).
    throw error;
  }
}

/**
 * コンポーネントインタラクションを安全に遅延更新（deferUpdate）します。
 * この関数は、ボタンやセレクトメニューの応答として、UIの更新のみを行い、新しいメッセージを送信しない場合に使用します。
 * 既に遅延または応答済みの場合は、重複した応答を避けるために何もしません。
 * @param {import('discord.js').Interaction} interaction - 対象のインタラクション
 */
async function safeDeferUpdate(interaction) {
  try {
    if (interaction.deferred || interaction.replied) {
      // 既に処理されている場合は何もしない
      return;
    }
    await interaction.deferUpdate();
  } catch (error) {
    logger.error(`[safeDeferUpdate] Failed to defer update`, {
      message: error.message,
      stack: error.stack,
      interactionId: interaction?.id,
      customId: interaction?.customId,
    });
    // エラーを再スローして、呼び出し元に関数の失敗を知らせます。
    throw error;
  }
}

/**
 * インタラクションに安全にフォローアップメッセージを送信します。
 * この関数は、`deferReply` などで最初の応答が既に行われた後に、追加のメッセージを送信する場合に使用します。
 * @param {import('discord.js').Interaction} interaction - 対象のインタラクション
 * @param {string | import('discord.js').InteractionReplyOptions} options - 返信内容
 */
async function safeFollowUp(interaction, options) {
  try {
    // followUpは最初の応答が完了している必要がある
    if (!interaction.replied && !interaction.deferred) {
      logger.warn('[safeFollowUp] Interaction was not replied to or deferred. Skipping followup and using safeReply instead.');
      // この場合、通常の応答として処理を試みる
      await safeReply(interaction, options);
      return;
    }
    await interaction.followUp(options);
  } catch (error) {
    logger.error(`[safeFollowUp] Failed to follow up`, {
      message: error.message,
      stack: error.stack,
      interactionId: interaction?.id,
      customId: interaction?.customId,
    });
    // フォローアップの失敗は通常、メインの処理フローを停止させるほど重大ではないため、エラーは再スローしません。
  }
}

module.exports = {
  safeReply,
  safeDefer,
  safeDeferUpdate,
  safeFollowUp,
};
