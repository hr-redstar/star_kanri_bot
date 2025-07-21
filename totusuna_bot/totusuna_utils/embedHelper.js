// utils/embedHelper.js
const { EmbedBuilder } = require('discord.js');

const BOT_NAME = 'STAR管理bot';

const COLORS = {
  PRIMARY: 0x0099ff,
  SUCCESS: 0x00AE86,
  ERROR: 0xff0000,
  WARNING: 0xFEE75C,
};

/**
 * 標準的なフッターとタイムスタンプを含むEmbedを作成
 * @param {Partial<import('discord.js').EmbedBuilder>} options - Embedオプション
 * @returns {EmbedBuilder}
 */
function createBaseEmbed(options) {
  const {
    footer = { text: BOT_NAME },
    timestamp = true,
    ...rest
  } = options;

  const embed = new EmbedBuilder(rest).setFooter(footer);
  if (timestamp) embed.setTimestamp();
  return embed;
}

/**
 * タイトルにアイコンを付加して色付きでメッセージEmbedを作成
 * @param {'✅'|'❌'|'⚠️'|'🔒'} emoji
 * @param {string} title
 * @param {string} description
 * @param {number} color
 * @returns {EmbedBuilder}
 */
function createLabeledEmbed(emoji, title, description, color) {
  return createBaseEmbed({
    title: `${emoji} ${title}`,
    description,
    color,
  });
}

/**
 * 管理者UI用Embed
 */
function createAdminEmbed(title, description) {
  return createLabeledEmbed('🔒', `${title} (管理者専用)`, description, COLORS.PRIMARY);
}

/**
 * 権限不足通知用Embed
 */
function createAdminRejectEmbed() {
  return createLabeledEmbed(
    '❌',
    '権限がありません',
    'この操作を実行するには、管理者権限または指定された管理者ロールが必要です。',
    COLORS.ERROR
  );
}

/**
 * 成功メッセージ用Embed
 */
function createSuccessEmbed(title, description) {
  return createLabeledEmbed('✅', title, description, COLORS.SUCCESS);
}

/**
 * エラーメッセージ用Embed
 */
function createErrorEmbed(title, description) {
  return createLabeledEmbed('❌', title, description, COLORS.ERROR);
}

/**
 * 警告メッセージ用Embed
 */
function createWarningEmbed(title, description) {
  return createLabeledEmbed('⚠️', title, description, COLORS.WARNING);
}

/**
 * STAR管理bot設定用のEmbedを生成
 * @param {import('discord.js').Guild} guild - ギルドオブジェクト
 * @param {string[]} adminRoleIds - 管理者ロールIDの配列
 * @param {string|null} notifyChannelId - 通知チャンネルID
 * @returns {EmbedBuilder}
 */
function createStarConfigEmbed(guild, adminRoleIds, notifyChannelId) {
  const roleMentions =
    adminRoleIds.length > 0
      ? adminRoleIds.map(id => {
          const role = guild.roles.cache.get(id);
          return role ? `<@&${id}>` : `~~(削除済ロール: ${id})~~`;
        }).join('\n')
      : '*未設定*';

  const notifyChannel = notifyChannelId ? guild.channels.cache.get(notifyChannelId) : null;
  const notifyDisplay = notifyChannel
    ? `<#${notifyChannelId}>`
    : notifyChannelId ? `~~(削除済チャンネル: ${notifyChannelId})~~` : '*未設定*';

  return new EmbedBuilder()
    .setTitle('🌟 STAR管理Bot設定')
    .setDescription(`**管理者ロールと通知チャンネルを設定します。**\n\n📌 **現在の管理者ロール**\n${roleMentions}\n\n📣 **現在の通知チャンネル**\n${notifyDisplay}`)
    .setColor(COLORS.PRIMARY);
}

module.exports = {
  BOT_NAME,
  COLORS,
  createBaseEmbed,
  createLabeledEmbed,
  createAdminEmbed,
  createAdminRejectEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createWarningEmbed,
  createStarConfigEmbed,
};
