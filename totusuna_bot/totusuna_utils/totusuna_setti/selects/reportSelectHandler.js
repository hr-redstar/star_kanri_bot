const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { tempDataStore } = require('../../tempDataStore');

module.exports = {
  // 'report_team_select_' と 'report_member_select_' の両方にマッチさせる
  customIdStart: 'report_',

  async handle(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    const isTeamSelect = interaction.customId.startsWith('report_team_select_');
    const isMemberSelect = interaction.customId.startsWith('report_member_select_');

    // このハンドラが意図せず他の 'report_' で始まるIDを拾った場合のガード
    if (!isTeamSelect && !isMemberSelect) {
      return;
    }

    const instanceId = interaction.customId.split('_').pop();
    const selectedValue = interaction.values[0];

    // 一時データ保存用のユニークなキーを生成
    const storeKey = `totsuna-report:${interaction.user.id}:${instanceId}`;
    const tempData = tempDataStore.get(storeKey) || {};

    // 選択された内容を保存
    if (isTeamSelect) {
      tempData.team = selectedValue;
    } else if (isMemberSelect) {
      tempData.member = selectedValue;
    }
    tempData.timestamp = Date.now(); // 有効期限管理用
    tempDataStore.set(storeKey, tempData);

    // 両方の値が揃ったかチェック
    if (tempData.team && tempData.member) {
      // データが揃ったので、モーダルを表示
      tempDataStore.delete(storeKey); // 一時データを削除

      // モーダルのcustomIdに、収集した情報と元のinstanceIdを埋め込む
      const modalCustomId = `totusuna_report_modal:submit:${instanceId}:team-${tempData.team}:member-${tempData.member}`;

      const modal = new ModalBuilder()
        .setCustomId(modalCustomId)
        .setTitle('📝 凸スナ報告フォーム (詳細)');

      const table1Input = new TextInputBuilder()
        .setCustomId('table1')
        .setLabel('卓1情報（任意）')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const table2Input = new TextInputBuilder()
        .setCustomId('table2')
        .setLabel('卓2情報（任意）')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const detailInput = new TextInputBuilder()
        .setCustomId('detail')
        .setLabel('詳細・補足（任意）')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(table1Input),
        new ActionRowBuilder().addComponents(table2Input),
        new ActionRowBuilder().addComponents(detailInput)
      );

      await interaction.showModal(modal);
    } else {
      // まだ片方しか選択されていない場合、メッセージを更新してユーザーに知らせる
      const teamLabel = tempData.team ? `✅ ${tempData.team}組` : '組数';
      const memberLabel = tempData.member ? `✅ ${tempData.member}名` : '人数';

      // 元のメッセージのコンポーネントを再構築して、選択済みのものを無効化する
      const updatedComponents = interaction.message.components.map(row => {
        const newRow = new ActionRowBuilder();
        row.components.forEach(component => {
          if (component.type === 3 /* StringSelectMenu */) {
            const newSelect = StringSelectMenuBuilder.from(component);
            if (component.customId.startsWith('report_team_select_') && tempData.team) {
              newSelect.setDisabled(true).setPlaceholder(`${tempData.team}組 を選択済み`);
            }
            if (component.customId.startsWith('report_member_select_') && tempData.member) {
              newSelect.setDisabled(true).setPlaceholder(`${tempData.member}名 を選択済み`);
            }
            newRow.addComponents(newSelect);
          }
        });
        return newRow;
      });

      await interaction.update({
        content: `報告内容: **${teamLabel}** / **${memberLabel}**\n残りの項目を選択してください。`,
        components: updatedComponents,
      });
    }
  },
};