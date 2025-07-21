// チャンネル選択用ボタンハンドラー
const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, MessageFlagsBitField } = require('discord.js');
const fileHelper = require('../../fileHelper');

module.exports = {
    customIdStart: 'totusuna_select_channel_',

    async handle(interaction) {
        console.log('🔘 [totusuna_select_channel] 処理開始', {
            user: interaction.user.tag,
            guild: interaction.guild?.name || '不明',
            customId: interaction.customId,
            timestamp: new Date().toISOString()
        });

        try {
            // 即座にデファー
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });
                console.log('✅ [totusuna_select_channel] インタラクションデファー完了');
            }

            // インスタンスID抽出
            const instanceId = interaction.customId.split('_').slice(-1)[0];
            console.log('🆔 [totusuna_select_channel] インスタンスID:', instanceId);

            const guildId = interaction.guild.id;
            const config = fileHelper.loadGuildConfig(guildId);

            // インスタンス確認
            const instance = config.totusuna?.instances?.find(inst => inst.id === instanceId);
            if (!instance) {
                throw new Error(`インスタンス ${instanceId} が見つかりません`);
            }

            // チャンネル選択メニュー作成
            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId(`totusuna_channel_selected_${instanceId}`)
                .setPlaceholder('投稿先チャンネルを選択してください')
                .addChannelTypes(ChannelType.GuildText);

            const selectRow = new ActionRowBuilder().addComponents(channelSelect);

            const embed = new EmbedBuilder()
                .setTitle('📢 チャンネル選択')
                .setDescription('TOTUSUNAを投稿するチャンネルを選択してください。')
                .addFields(
                    { name: 'インスタンス', value: instance.name, inline: true },
                    { name: 'ステータス', value: 'チャンネル選択中', inline: true }
                )
                .setColor('#ffa500')
                .setTimestamp();

            const response = {
                embeds: [embed],
                components: [selectRow],
                flags: MessageFlagsBitField.Flags.Ephemeral
            };

            if (interaction.deferred) {
                await interaction.editReply(response);
            } else {
                await interaction.reply(response);
            }

            console.log('✅ [totusuna_select_channel] チャンネル選択メニュー送信完了');

        } catch (error) {
            console.error('❌ [totusuna_select_channel] エラー:', {
                error: error.message,
                stack: error.stack,
                customId: interaction.customId
            });

            const errorMessage = '⚠️ チャンネル選択の準備中にエラーが発生しました。';

            try {
                if (interaction.deferred) {
                    await interaction.editReply({ content: errorMessage, flags: MessageFlagsBitField.Flags.Ephemeral });
                } else if (!interaction.replied) {
                    await interaction.reply({ content: errorMessage, flags: MessageFlagsBitField.Flags.Ephemeral });
                }
            } catch (replyError) {
                console.error('❌ [totusuna_select_channel] レスポンス送信エラー:', replyError.message);
            }
        }
    }
};
