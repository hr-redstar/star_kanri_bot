// commands/star_config.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  EmbedBuilder,
  ChannelType,
  MessageFlagsBitField
} = require('discord.js');
const { idManager } = require('../utils/idManager');
const { PermissionFlagsBits } = require('discord.js');
const { configManager } = require('../utils/configManager');
const { checkAdmin } = require('../utils/permissions/checkAdmin');
const { createAdminRejectEmbed, createErrorEmbed, createStarConfigEmbed } = require('../utils/embedHelper');
const logger = require('../utils/logger');
const { logAndReplyError } = require('../utils/errorHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('star_config')
    .setDescription('管理者のロールと通知チャンネルを設定します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // ✅ 応答タイムアウト防止 + 非公開（ephemeral）設定（flags: 64）
      try {
        await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });
      } catch (deferError) {
        logger.error('[star_config] deferReply に失敗', { error: deferError });

        // ❗ fallback reply（未応答であれば試みる）
        if (!interaction.replied && !interaction.deferred) {
          try {
            await interaction.reply({
              content: '⚠️ 応答に失敗しました。もう一度お試しください。',
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
          } catch (replyError) {
            logger.error('[star_config] fallback reply にも失敗', { error: replyError });
          }
        }

        return;
      }

      const { guild } = interaction;
      const guildId = guild.id;

      // ✅ 管理者チェック（管理者でなければ即 return）
      if (!(await checkAdmin(interaction))) {
        return await interaction.editReply({ embeds: [createAdminRejectEmbed()] });
      }

      let config;
      try {
        config = await configManager.getGuildConfig(guildId);
      } catch (err) {
        logger.error(`[star_config] 設定ファイルの読み込みに失敗 (Guild: ${guildId})`, { error: err });
        return interaction.editReply({
          embeds: [createErrorEmbed('設定エラー', '設定ファイルの読み込みに失敗しました。')],
        });
      }

      const currentAdminRoleIds = config.star?.adminRoleIds || [];
      const currentNotifyChannelId = config.star?.notifyChannelId || null;

      const settingsEmbed = createStarConfigEmbed(guild, currentAdminRoleIds, currentNotifyChannelId);

      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId(idManager.createSelectId('star_config', 'admin_role_select'))
        .setPlaceholder('管理者として許可するロールを選択')
        .setMinValues(0)
        .setMaxValues(25);

      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId(idManager.createSelectId('star_config', 'notify_channel_select'))
        .setPlaceholder('通知チャンネルを選択')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setMinValues(1)
        .setMaxValues(1);

      const row1 = new ActionRowBuilder().addComponents(roleSelect);
      const row2 = new ActionRowBuilder().addComponents(channelSelect);

      await interaction.editReply({
        embeds: [settingsEmbed],
        components: [row1, row2],
      });

    } catch (error) {
      await logAndReplyError(interaction, error, '設定画面の表示中にエラーが発生しました。');
    }
  }
};
