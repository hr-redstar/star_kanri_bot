// totusuna_config.js

const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlagsBitField,
} = require('discord.js');
const { idManager } = require('../utils/idManager.js');
const { totusunaConfigManager } = require('../utils/totusuna_setti/totusunaConfigManager.js');
const { checkAdmin } = require('../utils/permissions/checkAdmin.js');
const { createAdminEmbed } = require('../utils/embedHelper.js');
const { logAndReplyError } = require('../utils/errorHelper.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('totusuna_config')
    .setDescription('設置済みの凸スナ一覧を表示し、内容の確認・編集ができます（管理者専用）'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

      const isAdmin = await checkAdmin(interaction);
      if (!isAdmin) {
        return interaction.editReply({
          embeds: [createAdminEmbed('❌ 権限がありません', 'このコマンドを実行するには管理者権限が必要です。')]
        });
      }

      const guildId = interaction.guildId;
      const instances = await totusunaConfigManager.getAllInstances(guildId);

      if (instances.length === 0) {
        return interaction.editReply({
          embeds: [
            createAdminEmbed('📭 凸スナ設定', '現在、設定されている凸スナはありません。')
          ],
        });
      }

      const options = instances
        .filter(i => i.id) // Filter for instances that have a UUID
        .slice(0, 25) // Discord's limit for select menu options
        .map(i => {
          const label = i.body?.slice(0, 50) || '（無題）';
          const channel = i.installChannelId ? interaction.guild.channels.cache.get(i.installChannelId) : null;
          const description = channel ? `設置ch: #${channel.name}` : '設置チャンネル不明';
          return {
            label: label.length > 100 ? label.slice(0, 97) + '...' : label,
            value: i.id, // Use the unique ID as the value
            description: description,
          };
        });

      if (options.length === 0) {
        return interaction.editReply({
          embeds: [
            createAdminEmbed('⚠️ データエラー', '有効な凸スナデータが見つかりません。')
          ],
        });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(idManager.createSelectId('totusuna_config', 'select'))
        .setPlaceholder('設定を変更する凸スナを選択してください')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.editReply({
        embeds: [
          createAdminEmbed(
            '📋 凸スナ設定管理',
            `設定済みの凸スナ（${options.length}件）が一覧に表示されています。\nメニューから対象を選択すると、詳細の確認や編集・削除ができます。`
          )
        ],
        components: [row],
      });
    } catch (error) {
      await logAndReplyError(interaction, error, '凸スナ設定の読み込み中にエラーが発生しました。');
    }
  },
};
