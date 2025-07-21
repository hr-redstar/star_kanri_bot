# kpi_setti.js コマンド仕様書

## 概要
KPI報告の案内メッセージを送信し、目標設定と実績申請のボタンUIを提供するコマンドです。

## コマンド情報
- **コマンド名**: `/kpi_設定`
- **説明**: KPI報告の案内メッセージを送信します
- **権限**: 管理者専用（requireAdmin適用）
- **応答形式**: Ephemeral（プライベートメッセージ）

## 機能詳細

### 主な機能
1. KPI目標設定ボタンの提供
2. KPI実績申請ボタンの提供
3. 管理者向けUI表示

### ボタン構成
```javascript
const targetButton = new ButtonBuilder()
  .setCustomId('kpi_target_start_button')
  .setLabel('KPI目標')
  .setStyle(ButtonStyle.Primary);

const reportButton = new ButtonBuilder()
  .setCustomId('kpi_report_start_button')
  .setLabel('KPI申請')
  .setStyle(ButtonStyle.Success);
```

## 依存関係
- `discord.js`: SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
- `../utils/permissions/requireAdmin`: 管理者権限チェック

## 実行フロー
1. 管理者権限チェック
2. ボタンUI作成
3. メッセージ送信

## 連携するハンドラ
- `utils/kpi_setti/buttons/kpi_target_start_button.js`: 目標設定開始
- `utils/kpi_setti/buttons/kpi_report_start_button.js`: 実績申請開始

## エラーハンドリング
- 権限不足時: requireAdminによる自動拒否
- ボタン作成失敗: Discord.jsの内部エラーハンドリング

## 使用例
```
/kpi_設定
→ 「KPI報告　目標設定・申請ボタン」メッセージとボタンを表示
```

## 注意事項
- 管理者ロールが設定されていない場合は使用不可
- ボタン押下後はstepChatHandlerによる対話式入力に移行
