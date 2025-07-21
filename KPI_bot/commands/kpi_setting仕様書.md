# kpi_setting.js コマンド仕様書

## 概要
KPI設定用のモーダルダイアログを表示し、店舗追加・対象日・目標人数の設定を行うコマンドです。

## コマンド情報
- **コマンド名**: `/kpi_setting`
- **説明**: KPI設定用のモーダルを表示します
- **権限**: 管理者専用（requireAdmin適用）
- **応答形式**: Modal表示

## 機能詳細

### 主な機能
1. KPI設定モーダルの表示
2. 店舗名の複数追加（カンマ区切り）
3. 対象日の設定（YYYY-MM-DD形式）
4. 目標人数の設定

### モーダル構成
```javascript
const modal = new ModalBuilder()
  .setCustomId('kpi_setting_modal')
  .setTitle('KPI設定');

// 入力フィールド:
// 1. newShop: 店舗名（複数可、カンマ区切り）
// 2. targetDate: 対象日（YYYY-MM-DD）
// 3. targetCount: 目標人数
```

### 入力フィールド詳細
| フィールドID | ラベル | 形式 | 必須 | 説明 |
|-------------|--------|------|------|------|
| newShop | 店舗名（カンマ区切りで複数追加可能） | Short | No | 新規店舗の追加 |
| targetDate | 対象日 (YYYY-MM-DD) | Short | Yes | KPI対象日 |
| targetCount | 目標人数 | Short | Yes | 達成目標値 |

## 依存関係
- `discord.js`: SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
- `../utils/permissions/requireAdmin`: 管理者権限チェック

## 実行フロー
1. 管理者権限チェック
2. モーダル作成
3. 入力フィールド設定
4. モーダル表示

## 連携するハンドラ
- モーダル送信後の処理は別途実装が必要
- `kpi_setting_modal` customIdに対応するモーダルハンドラが必要

## バリデーション
- 対象日: YYYY-MM-DD形式の検証が推奨
- 目標人数: 数値形式の検証が推奨
- 店舗名: カンマ区切りの解析処理が必要

## 使用例
```
/kpi_setting
→ KPI設定モーダルが表示
→ ユーザーが各フィールドに入力
→ 送信ボタンでモーダルハンドラに処理委譲
```

## 注意事項
- モーダル送信後の処理実装が別途必要
- 入力値のバリデーション実装推奨
- 店舗名のカンマ区切り解析処理が必要
