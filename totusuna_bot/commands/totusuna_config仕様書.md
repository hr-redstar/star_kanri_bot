# totusuna_config.js コマンド仕様書

## 概要
設置済みの凸スナ一覧を表示し、内容の確認・編集ができる管理コマンドです。凸スナシステムの統合管理を担当します。

## コマンド情報
- **コマンド名**: `/凸スナ設定`
- **説明**: 設置済みの凸スナ一覧を表示し、内容の確認・編集ができます（管理者専用）
- **権限**: 管理者専用（requireAdmin適用）
- **応答形式**: Ephemeral（プライベートメッセージ）

## 機能詳細

### 主な機能
1. 設置済み凸スナの一覧表示
2. 個別凸スナの選択・管理
3. セレクトメニューによる操作UI
4. 設置チャンネル情報の表示

### 表示フロー
```javascript
// 1. 設定ファイル読み込み
const data = await readJSON(filePath);
const instances = data.totusuna?.instances || [];

// 2. 凸スナ存在チェック
if (instances.length === 0) {
  // 空状態メッセージ表示
}

// 3. セレクトメニュー作成
const options = instances.map(i => ({
  label: i.body?.slice(0, 50) || '（無題）',
  value: i.messageId || i.id,
  description: i.mainChannelId ? `<#${i.mainChannelId}>` : '設置チャンネル不明'
}));
```

## 依存関係
- `discord.js`: SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType, MessageFlags, EmbedBuilder
- `../utils/fileHelper.js`: ensureGuildJSON, readJSON
- `../utils/permissions/requireAdmin.js`: 管理者権限チェック

## データ構造
```javascript
// data/<guildId>/<guildId>.json の totusuna セクション
{
  "totusuna": {
    "instances": [
      {
        "id": "uuid-string",
        "messageId": "discord_message_id",
        "body": "凸スナの本文内容",
        "mainChannelId": "設置チャンネルID",
        "userId": "設置者のユーザーID",
        "installChannelId": "設置チャンネルID（新形式）",
        "replicateChannelIds": ["複製チャンネルID1", "複製チャンネルID2"]
      }
    ]
  }
}
```

## セレクトメニュー構成
```javascript
const selectMenu = new StringSelectMenuBuilder()
  .setCustomId('totusuna_config_select')
  .setPlaceholder('編集する凸スナを選択してください')
  .setMaxValues(1);

// オプション例:
// label: "本日のイベント参加者募集中です！詳細は..."
// value: "1234567890123456789"
// description: "#イベント告知"
```

## 実行フロー
1. 管理者権限チェック
2. 設定ファイル読み込み
3. 凸スナインスタンス取得
4. 存在確認とUI分岐
5. セレクトメニュー作成
6. ユーザー選択待機

## 連携するハンドラ
- `utils/totusuna_config/selects/totusuna_config_select.js`: 凸スナ選択処理
- その他の凸スナ編集・削除機能

## 表示例

### 凸スナが存在する場合
```
📭 凸スナ設定メニュー
現在3件の凸スナが設置されています。

[セレクトメニュー]
├ 本日のイベント参加者募集中です！詳細は... - #イベント告知
├ 緊急メンテナンスのお知らせです。サーバー... - #お知らせ
└ 新メンバー歓迎パーティーを開催します！... - #雑談
```

### 凸スナが存在しない場合
```
📭 凸スナ設定メニュー
現在、設置されている凸スナはありません。
```

## エラーハンドリング
- ファイル読み込みエラー: ensureGuildJSONによる自動生成
- データ構造エラー: 空配列へのフォールバック
- 権限エラー: requireAdminによる自動拒否

## フィルタリング機能
```javascript
const options = instances
  .filter(i => i.messageId || i.id)  // 有効なIDを持つもののみ
  .map(i => ({
    label: i.body?.slice(0, 50) || '（無題）',  // 本文50文字制限
    value: i.messageId || i.id,  // 新旧ID形式対応
    description: i.mainChannelId ? `<#${i.mainChannelId}>` : '設置チャンネル不明'
  }));
```

## 使用例
```
/凸スナ設定
→ 設置済み凸スナ一覧表示
→ セレクトメニューから編集対象選択
→ 編集・削除オプション表示
```

## 管理機能
選択後に利用可能な機能（ハンドラ依存）：
- 本文編集
- チャンネル変更
- 複製設定変更
- 削除
- 状態確認

## 注意事項
- セレクトメニューの選択肢は最大25個まで
- 本文表示は50文字で切り詰め
- 旧形式と新形式のデータ構造に対応
- チャンネル削除時の表示に注意

## 今後の改善点
- ページネーション機能（25件超過時）
- 検索・フィルタ機能
- 一括操作機能
- 詳細情報表示の拡充
