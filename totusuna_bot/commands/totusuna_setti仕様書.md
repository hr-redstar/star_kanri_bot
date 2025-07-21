# totusuna_setti.js コマンド仕様書

## 概要
凸スナの新規設置を行うための管理メニューを表示するコマンドです。凸スナシステムの設置・管理の中核機能を提供します。

## コマンド情報
- **コマンド名**: `/凸スナ設置`
- **説明**: 指定チャンネルに凸スナ案内メッセージとボタンを設置します（管理者専用）
- **権限**: 管理者専用（requireAdmin適用）
- **応答形式**: Ephemeral（プライベートメッセージ）

## 機能詳細

### 主な機能
1. 凸スナ設置ボタンの提供

### Embed構成
```javascript
const embed = new EmbedBuilder()
  .setTitle('📌 凸スナ 新規設置')
  .setDescription([
    '🆕 新しい凸スナ報告メッセージを設置するには、「新規設置」ボタンを押してください。',
    '',
    '**💡 ヒント**',
    '• 設置済みの凸スナを管理するには `/凸スナ設定` を使用してください。',
    '• 報告データをCSVで出力するには `/凸スナcsv` を使用してください。'
  ].join('\n'))
  .setColor(0x2ecc71);
```

## 依存関係
- `discord.js`: SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags
- `../utils/permissions/requireAdmin`: 管理者権限チェック
- `../utils/embedHelper`: createAdminEmbed

## 実行フロー
1. 管理者権限チェック
2. Embed作成（機能説明）
3. ボタンUI作成
4. メッセージ送信

## 連携するハンドラ

### ボタンハンドラ
| ボタン | ハンドラファイル | 機能 |
|--------|------------------|:---|
| 🆕 新規設置 | `utils/totusuna_setti/buttons/install.js` | 本文入力モーダルを表示 |

### モーダルハンドラ
| モーダルID | ハンドラファイル | 機能 |
|---|---|:---|
| `totusuna_modal_install` | `utils/totusuna_setti/modals/install.js` | 本文を受け取り、メインチャンネル選択UIを表示 |

### セレクトメニューハンドラ
| メニューID | ハンドラファイル | 機能 |
|---|---|:---|
| `totusuna_setti:select_install_channel` | `utils/totusuna_setti/selects/select_install_channel.js` | メインチャンネルを保存し、連携チャンネル選択UIを表示 |
| `totusuna_setti:select_replicate_channels` | `utils/totusuna_setti/selects/select_replicate_channels.js` | 連携チャンネルを受け取り、凸スナを設置・保存 |

### 設置フロー（📝 凸スナ設置）
1. **ボタンクリック**: `install.js` がモーダルを表示します。
2. **モーダル送信**: `modals/install.js` が本文を受け取り、一時データストアに保存後、メインチャンネル選択メニューを表示します。
3. **メインチャンネル選択**: `select_install_channel.js` が選択されたチャンネルIDを一時データストアに追記し、連携チャンネル選択メニューを表示します。
4. **連携チャンネル選択**: `select_replicate_channels.js` が最終的な設定を元に、メインチャンネルと連携チャンネルにメッセージを投稿し、設定を `configManager` を通じてJSONファイルに永続化します。

### チャンネル選択UI（モーダル送信後）
モーダルで本文が入力されると、次のステップとしてチャンネル選択メニューが表示されます。

**メッセージ内容:**
```
✅ 本文を受け付けました。
次に、この凸スナ案内を設置するチャンネルを選択してください。
```

**UIコンポーネント:**
- `ChannelSelectMenu`: 設置先のチャンネルを1つ選択します。

### 連携チャンネル選択UI（メインチャンネル選択後）
メインチャンネルが選択されると、次のステップとして連携チャンネル選択メニューが表示されます。

**メッセージ内容:**
```
✅ メインチャンネルとして <#...> を選択しました。
次に、報告を連携するチャンネルを選択してください（任意）。
```

**UIコンポーネント:**
- `ChannelSelectMenu`: 連携先のチャンネルを複数選択できます（任意）。

## エラーハンドリング
```javascript
catch (error) {
  console.error('凸スナ設置メニューエラー:', error);
  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({
      content: '❌ 凸スナ設置メニューの表示でエラーが発生しました。',
      flags: MessageFlags.Ephemeral
    });
  }
}
```

## 使用例
```
/凸スナ設置
→ 凸スナ設置メニュー表示
→ 「📝 凸スナ設置」選択
→ 本文入力 → チャンネル選択 → 設置完了

```

## 設置される凸スナの構造
```javascript
// 実際に設置されるメッセージ
const embed = new EmbedBuilder()
  .setTitle('📣 凸スナ報告受付中')
  .setDescription(userInputBody)
  .setColor(0x00bfff);

const button = new ButtonBuilder()
  .setCustomId(`totsuna:report:${uuid}`)
  .setLabel('凸スナ報告')
  .setStyle(ButtonStyle.Primary);
```

## データ永続化
設置後のデータ保存形式：
```javascript
// data/<guildId>/<guildId>.json
{
  "totsuna": {
    "instances": [
      {
        "id": "uuid-v4",
        "userId": "設置者ID",
        "title": "凸スナ報告受付中",
        "body": "凸スナ本文",
        "installChannelId": "設置チャンネルID",
        "replicateChannelIds": ["複製先ID1", "複製先ID2"],
        "messageId": "DiscordメッセージID"
      }
    ]
  }
}
```

## 機能別詳細

### 🆕 新規設置（標準設置）
- **用途**: 重要な告知・複数チャンネル配信

## 想定利用シーン
1. **イベント告知**: 参加者募集の凸スナ設置
2. **緊急連絡**: 重要情報の即座配信
3. **定期案内**: 定期的な情報収集
4. **アンケート**: 意見・感想の収集

## 注意事項
- UUID重複の可能性は極めて低い（uuid v4使用)
- チャンネル削除時の凸スナ動作に注意
- JSON保存失敗時のロールバック機能なし

## セキュリティ考慮
- 管理者権限必須
- UUID による一意識別
- チャンネル権限の継承
- 設定ファイルアクセス制御


凸スナ設置

/凸スナ設置 embed 📌 凸スナ 新規設置 🆕 新しい凸スナ報告メッセージを設置するには、「新規設置」ボタンを押してください。

💡 ヒント • 設置済みの凸スナを管理するには /凸スナ設定 を使用してください。 • 報告データをCSVで出力するには /凸スナcsv を使用してください。 新規設置ボタン

新規設置ボタン→モーダル入力→連携チャンネルをリスト選択(複数可)→凸スナ報告embedを/凸スナ設置コマンドが実行されたテキストチャンネルに送信→凸スナ報告ボタンで入力された内容を「凸スナ設置チャンネル」「連携チャンネル」に送信