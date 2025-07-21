# STAR管理Bot 仕様書（凸スナ報告統合）

## 🔰 概要

**STAR管理Bot** は、Discord上で「凸スナ報告」や「管理ロール設定」など、クラン・ギルド運営に役立つ機能を統合したBotです。主に以下の機能を提供します：

- 凸スナ（凸スケジュール）設置・報告機能  
- 管理者ロール設定機能  
- 各種設定のボタン・モーダルUI対応  
- CSV形式による報告ログ保存  

ファイルベースでの永続化に対応し、Google Cloud や Render 等の Linux 環境に対応しています。

---

## 🧩 機能一覧

| 機能                  | 説明                                                                 |
|-----------------------|----------------------------------------------------------------------|
| /totusuna_setti       | 新しい凸スナ報告メッセージを、対話形式でチャンネルに設置します。        |
| /totusuna_config      | 設置済みの凸スナを一覧表示し、本文の編集や再送信、削除ができます。       |
| 凸スナ報告ボタン      | 組数・人数を選択後、詳細入力モーダルを開き報告。CSVに追記＋報告送信      |
| /star_kpi_setti       | KPI報告用の「目標設定」「実績申請」ボタンを設置します。                  |
| /star_kpi_config      | KPIの目標（店舗、期間、人数）を設定します。                             |
| KPI報告ボタン         | 店舗選択→実績入力モーダルで報告。CSVに追記します。                      |
| /star_config          | 管理者ロールの追加・削除（RoleSelect UI対応）、リアクション設定など           |
| 設定UI（ボタン）      | UI上で「再送信」「削除」「編集」などを操作可能                            |

---

## 🗃️ データ構造と保存先

### 1. ギルド共通設定ファイル（JSON）

保存先：`data/<GUILD_ID>/<GUILD_ID>.json`

```json
{
  "star_config": {
    "adminRoleIds": ["1234567890", "9876543210"],
    "reaction": {
      "emoji": "⭐",
      "text": "報告ありがとう！"
    }
  },
  "totusuna": {
    "instances": [
      {
        "id": "uuid-v4",
        "title": "📣 凸スナ報告受付中",
        "body": "報告はこちらから！",
        "installChannelId": "99999999",
        "messageId": "1122334455",
        "replicateChannelIds": [],
        "createdBy": "123456789012345678",
        "createdAt": "2025-07-20T10:00:00.000Z"
      }
    ],
    "kpi": {
      "shops": ["店舗A", "店舗B"],
      "targets": {
        "店舗A": [
          {
            "date": "2025-07-20",
            "target": 100,
            "setBy": "user#1234",
            "setAt": "2025-07-20T10:00:00.000Z"
          }
        ]
      }
    }
  }
}

### 2. 各種報告CSVファイル
保存先：data/<GUILD_ID>/<GUILD_ID>-YYYY-MM-凸スナ報告.csv
列構成（初回のみヘッダー出力）：
報告者名,日時,何組,何名,卓1,卓2,卓3,卓4,詳細
Alice,2025-07-10T12:00:00Z,2組,3名,あ,B,C,D,詳細内容

保存先：data/<GUILD_ID>/<GUILD_ID>-YYYY-MM-KPI報告.csv
列構成：報告者,報告時刻,店舗名,対象日,実績詳細

🛠️ 使用コマンド詳細
✅ /凸スナ設置
ボタン＋本文UI表示

モーダルで本文入力 → 指定チャンネルにEmbed+ボタン投稿

保存：tousuna.instances に追記

✅ /凸スナ設定
セレクトメニューで設置済みの凸スナ一覧を表示。

選択後、詳細情報と「本文編集」「再送信」「削除」ボタンを表示。

各ボタンはそれぞれのハンドラ（`edit.js`, `resend.js`, `delete.js`）に連携。

保存：`totusunaConfigManager` を通じて `tousuna.instances` を更新または削除。

✅ 凸スナ報告ボタン
ボタンを押すと、本人にしか見えないメッセージで「組数」と「人数」のセレクトメニューを表示。

両方を選択すると、詳細入力用のモーダルが表示されます。

モーダル送信後、報告内容を整形してEmbedを作成し、メインチャンネルと連携チャンネルに送信。同時に、報告内容をCSVファイルに追記。

✅ /STAR管理bot設定
管理ロールを複数指定（RoleSelect）

リアクション絵文字・文言も設定可能

✅ /star_KPI設置 & /star_KPI設定
`/star_KPI設置`で「KPI目標」「KPI申請」ボタンを設置。

「KPI目標」ボタンまたは`/star_KPI設定`コマンドで、目標設定モーダルを表示。店舗の新規登録と、全店舗共通の目標日・目標人数を設定。

「KPI申請」ボタンで、登録済みの店舗を選択するセレクトメニューを表示。

店舗選択後、実績入力モーダルを表示。
モーダル送信後、`data/<GUILD_ID>/<GUILD_ID>-YYYY-MM-KPI報告.csv`に内容を追記。

保存先：star_config.adminRoleIds, reaction

📁 ディレクトリ構成（簡易）

├── commands/
│   ├── tousuna_setti.js
│   ├── star_config/
│   │   └── star_config.js
│
├── utils/ # ユーティリティ
│   ├── totusuna_setti/ # 凸スナ機能関連
│   │   ├── buttons/
│   │   │   ├── delete.js
│   │   │   ├── edit.js
│   │   │   ├── reportButton.js # 新しい報告ボタンの処理
│   │   │   └── resend.js
│   │   ├── modals/
│   │   │   ├── editBody.js
│   │   │   ├── install.js
│   │   │   └── submit.js # 新しい報告モーダルの処理
│   │   ├── selects/
│   │   │   ├── reportSelectHandler.js # 新しいセレクトメニューの処理
│   │   │   ├── select_install_channel.js
│   │   │   └── select_replicate_channels.js
│   │   ├── index.js # 機能ハンドラの集約
│   │   └── totusunaConfigManager.js
│   ├── star_kpi_setti/ # KPI機能関連
│   │   ├── buttons/
│   │   ├── modals/
│   │   └── selects/
│   │   └── index.js
│   ├── kpiConfigManager.js
│   └── unifiedInteractionHandler.js # 全インタラクションの司令塔
│
├── data/
│   └── <GUILD_ID>/
│       ├── <GUILD_ID>.json
│       └── <GUILD_ID>-YYYY-MM-凸スナ報告.csv


⚙️ 運用・デプロイ構成（例）
.env 設定例
DISCORD_TOKEN=（Botのトークン）
CLIENT_ID=（BotのクライアントID）
GUILD_ID=（開発用ギルドID）

PM2 用 ecosystem.config.js
require('dotenv').config();

module.exports = {
  apps: [
    {
      name: "star-kanri-bot",
      script: "./index.js",
      env: {
        NODE_ENV: "production",
        DISCORD_TOKEN: process.env.DISCORD_TOKEN,
        CLIENT_ID: process.env.CLIENT_ID
      }
    }
  ]
};

コマンド登録（devcmdup.js）
node devcmdup.js

🚀 今後の拡張案（ToDo）
| 拡張内容        | 補足説明                                  |
| ----------- | ------------------------------------- |
| KPI統合       | KPI報告モジュールと統合（既存 `/kpi_設置` との統合設計）    |
| 自動集計＋グラフ化   | 集計→Embed表示 or グラフ画像化（QuickChart API等） |
| GPT自動応答連携   | 「今の凸スナ報告は？」など自然言語で取得可能に               |
