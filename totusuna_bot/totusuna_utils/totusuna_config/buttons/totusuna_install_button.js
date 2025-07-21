// 欠落していたtotusuna_install_buttonハンドラー
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fileHelper = require('../../fileHelper');
const uuid = require('crypto').randomUUID;

module.exports = {
    customId: 'totusuna_install_button',

    async handle(interaction) {
        console.log('🔘 [totusuna_install_button] 処理開始', {
            user: interaction.user.tag,
            guild: interaction.guild?.name || '不明',
            interactionId: interaction.id,
            timestamp: new Date().toISOString()
        });

        try {
            // 即座にデファー（タイムアウト防止）
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                console.log('✅ [totusuna_install_button] インタラクションデファー完了');
            }

            const guildId = interaction.guild.id;
            const dataPath = path.join(__dirname, '../../../data', guildId, `${guildId}.json`);
            
            // Guild設定確認
            const config = fileHelper.loadGuildConfig(guildId);
            console.log('📊 [totusuna_install_button] 現在の設定:', {
                guildId,
                hasTotusunaConfig: !!config.totusuna,
                instancesCount: config.totusuna?.instances?.length || 0
            });
            
            // 新しいインスタンス作成
            const instanceId = uuid();
            const newInstance = {
                id: instanceId,
                name: `TOTUSUNA ${new Date().toLocaleDateString('ja-JP')}`,
                channelId: null,
                createdAt: new Date().toISOString(),
                status: 'setup',
                participants: []
            };
            
            // 設定に追加
            if (!config.totusuna) {
                config.totusuna = { instances: [] };
            }
            if (!Array.isArray(config.totusuna.instances)) {
                config.totusuna.instances = [];
            }
            
            config.totusuna.instances.push(newInstance);
            
            // 保存
            fileHelper.saveGuildConfig(guildId, config);
            console.log('💾 [totusuna_install_button] 新インスタンス保存完了:', instanceId);
            
            // セットアップ用embed作成
            const setupEmbed = new EmbedBuilder()
                .setTitle('📋 TOTUSUNA セットアップ')
                .setDescription('新しいTOTUSUNAインスタンスを作成しました！\n投稿するチャンネルを選択してください。')
                .addFields(
                    { name: 'インスタンスID', value: instanceId, inline: true },
                    { name: 'ステータス', value: '設定中', inline: true },
                    { name: '作成日時', value: new Date().toLocaleString('ja-JP'), inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            const channelSelectRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`totusuna_select_channel_${instanceId}`)
                        .setLabel('📢 チャンネル選択')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`totusuna_cancel_setup_${instanceId}`)
                        .setLabel('❌ キャンセル')
                        .setStyle(ButtonStyle.Secondary)
                );

            // レスポンス送信
            const response = {
                embeds: [setupEmbed],
                components: [channelSelectRow],
                flags: MessageFlags.Ephemeral
            };

            if (interaction.deferred) {
                await interaction.editReply(response);
            } else {
                await interaction.reply(response);
            }

            console.log('✅ [totusuna_install_button] セットアップレスポンス送信完了');

        } catch (error) {
            console.error('❌ [totusuna_install_button] エラー:', {
                error: error.message,
                stack: error.stack,
                interactionId: interaction.id,
                deferred: interaction.deferred,
                replied: interaction.replied
            });

            const errorMessage = '⚠️ TOTUSUNA インスタンスの作成中にエラーが発生しました。';

            try {
                if (interaction.deferred) {
                    await interaction.editReply({ content: errorMessage, flags: MessageFlags.Ephemeral });
                } else if (!interaction.replied) {
                    await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
                }
            } catch (replyError) {
                console.error('❌ [totusuna_install_button] レスポンス送信エラー:', replyError.message);
            }
        }
    }
};
