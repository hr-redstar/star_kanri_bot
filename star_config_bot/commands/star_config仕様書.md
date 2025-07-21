# star_config.js コマンド仕様書

## 概要
STAR管理botの管理者ロールと通知チャンネルを設定する中核的な設定コマンドです。ボット全体の権限管理の基盤となります。

## コマンド情報
- **コマンド名**: `/star管理bot設定`
- **説明**: 管理者のロールと通知チャンネルを設定します
- **権限**: 管理者専用（requireAdmin適用 + Administrator権限）
- **応答形式**: Interactive UI（セレクトメニュー）

## 機能詳細

### 主な機能
1. 管理者ロールの設定（複数選択可能）
2. 通知チャンネルの設定
3. 設定の永続化（JSON形式）
4. インタラクティブな設定UI

### 設定フロー
```javascript
// 1. 既存設定の読み込み
const data = await readJSON(filePath);

// 2. データ構造の互換性確保
if (!data.star_config) data.star_config = {};

// 3. 旧形式からの移行
if (data.adminRoleIds && !data.star_config.adminRoleIds) {
  data.star_config.adminRoleIds = data.adminRoleIds;
}
```

### セレクトメニュー構成
1. **管理者ロール選択**
   - `customId`: 'admin_role_select'
   - `placeholder`: '管理者ロールを選択してください（複数選択可能）'
   - `maxValues`: 10

2. **通知チャンネル選択**
   - `customId`: 'notify_channel_select'
   - `placeholder`: '通知チャンネルを選択してください'
   - `channelTypes`: [ChannelType.GuildText]

## 依存関係
- `discord.js`: SlashCommandBuilder, ActionRowBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ComponentType, EmbedBuilder, ChannelType, PermissionFlagsBits
- `../utils/fileHelper`: readJSON, writeJSON, ensureGuildJSON
- `../utils/permissions/requireAdmin`: 管理者権限チェック

## データ構造
```javascript
// data/<guildId>/<guildId>.json
{
  "star_config": {
    "adminRoleIds": ["role_id_1", "role_id_2", ...],
    "notifyChannelId": "channel_id"
  }
}
```

## 実行フロー
1. 管理者権限チェック
2. 設定ファイル読み込み
3. データ構造互換性確保
4. 既存設定値の表示
5. セレクトメニューUI作成
6. ユーザー操作待機

## 連携するハンドラ
- `utils/star_config/selects/star_admin_role_select.js`: 管理者ロール設定処理
- `utils/star_config/selects/star_notify_channel_select.js`: 通知チャンネル設定処理

## セキュリティ機能
```javascript
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
```
- Discord標準のAdministrator権限必須
- requireAdminによる二重チェック
- 設定変更の権限制御

## エラーハンドリング
```javascript
// ファイル読み込みエラー
catch (err) {
  console.error('❌ ファイル読み込みエラー:', err);
  return await interaction.reply({
    content: '❌ 設定ファイルの読み込みに失敗しました。',
    ephemeral: true
  });
}
```

## 互換性機能
### 旧形式からの自動移行
```javascript
// 古い形式から新しい形式への移行
if (data.adminRoleIds && !data.star_config.adminRoleIds) {
  data.star_config.adminRoleIds = data.adminRoleIds;
}
if (data.notifyChannelId && !data.star_config.notifyChannelId) {
  data.star_config.notifyChannelId = data.notifyChannelId;
}
```

## 使用例
```
/star管理bot設定
→ 現在の設定状況表示
→ 管理者ロール選択（複数可）
→ 通知チャンネル選択
→ 設定保存完了
```

## 設定後の影響
- **全管理者コマンド**: 設定されたロールを持つユーザーのみ実行可能
- **通知機能**: 設定されたチャンネルに各種通知送信

## 注意事項
- 初回設定時はサーバーの `Administrator` 権限を持つユーザーが実行する必要がある。

## トラブルシューティング
1. **権限エラー**: コマンド実行者にDiscordの `Administrator` 権限があるか確認。
2. **設定が保存されない**: Botが動作しているサーバーのファイル書き込み権限を確認。
3. **UIが表示されない**: Botのログで `configManager` や `editReply` のエラーを確認。
