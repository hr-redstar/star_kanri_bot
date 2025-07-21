const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

/**
 * 「凸スナ報告」ボタンが押された際の処理。
 * ユーザーにのみ表示されるメッセージ（ephemeral）で、
 * 組数と人数を選択するためのセレクトメニューを提示します。
 */
module.exports = {
  // customIdが 'report_totsuna_button_' で始まるボタンを処理します。
  // このプレフィックスは、ボタンを作成する側のコードと一致させる必要があります。
  customIdStart: 'report_totsuna_button_',

  async handle(interaction) {
    // ボタンのIDから凸スナ報告の対象となるインスタンスIDを抽出
    const instanceId = interaction.customId.substring(this.customIdStart.length);

    // 1. 「組数」を選択するセレクトメニューを作成
    const teamSelectMenu = new StringSelectMenuBuilder()
      .setCustomId(`report_team_select_${instanceId}`)
      .setPlaceholder('報告する組数を選択してください')
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('1組').setValue('1'),
        new StringSelectMenuOptionBuilder().setLabel('2組').setValue('2'),
        new StringSelectMenuOptionBuilder().setLabel('3組').setValue('3'),
        new StringSelectMenuOptionBuilder().setLabel('4組').setValue('4'),
        new StringSelectMenuOptionBuilder().setLabel('5組').setValue('5'),
        new StringSelectMenuOptionBuilder().setLabel('6組').setValue('6')
      );

    // 2. 「人数」を選択するセレクトメニューを作成
    const memberSelectMenu = new StringSelectMenuBuilder()
      .setCustomId(`report_member_select_${instanceId}`)
      .setPlaceholder('報告する人数を選択してください');

    // 1名から15名までの選択肢を動的に生成
    const memberOptions = [];
    for (let i = 1; i <= 15; i++) {
      memberOptions.push(
        new StringSelectMenuOptionBuilder().setLabel(`${i}名`).setValue(`${i}`)
      );
    }
    memberSelectMenu.addOptions(memberOptions);

    // 3. セレクトメニューをActionRowに配置
    const teamActionRow = new ActionRowBuilder().addComponents(teamSelectMenu);
    const memberActionRow = new ActionRowBuilder().addComponents(memberSelectMenu);

    // 4. 本人にしか見えないメッセージで返信
    await interaction.reply({
      content: '凸スナ報告ありがとうございます！\n以下のリストから組数と人数を選択してください。',
      components: [teamActionRow, memberActionRow],
      ephemeral: true, // このメッセージは操作した本人にしか見えません
    });
  },
};