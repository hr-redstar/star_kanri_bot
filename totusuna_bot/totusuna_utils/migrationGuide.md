// utils/migrationGuide.md

# ハンドラー統合移行ガイド

## 統合の目的

現在のコードベースには以下の問題があり、統合することでより効率的で保守しやすい構造にできます：

### 現在の問題点

1. **重複するハンドラー構造**
   - `buttonsHandler.js`, `modalsHandler.js`, `selectsHandler.js` が類似の処理
   - 各機能ディレクトリに同じパターンのファイルが存在

2. **分散したルーティング処理**
   - 複数の `index.js` や `handleSelect.js` が同様の処理を実装
   - customId の解析処理が分散

3. **命名規則の不統一**
   - `totusuna_*` と `totsusuna_*` の混在
   - プレフィックスルールが不明確

## 統合提案

### 新しいファイル構造

```
utils/
├── unifiedInteractionHandler.js  # 統合インタラクションハンドラー
├── configManager.js              # 統合設定管理
├── idManager.js                  # ID生成・解析
├── migrationHelper.js            # 移行補助ツール
└── [既存のハンドラーは段階的に置き換え]
```

### 統合できるファイル

#### 1. インタラクションハンドラー類
**統合対象:**
- `utils/buttonsHandler.js`
- `utils/modalsHandler.js` 
- `utils/selectsHandler.js`
- `utils/interactionHandler.js` (空ファイル)

**統合先:** `utils/unifiedInteractionHandler.js`

#### 2. セレクトハンドラー類
**統合対象:**
- `utils/star_config/selects/index.js`
- `utils/totusuna_setti/selects/handleSelect.js`
- `utils/totusuna_setti/selects/install_channel.js`

**統合方針:** 各機能固有の処理は残し、共通ルーティング部分を統合

#### 3. 設定管理
**統合対象:**
- 各ディレクトリ内の設定読み書き処理
- ギルドデータ管理の重複部分

**統合先:** `utils/configManager.js`

### 移行手順

#### フェーズ1: 統合ハンドラーの導入
1. `unifiedInteractionHandler.js` を作成 ✅
2. `index.js` で統合ハンドラーを使用
3. 既存ハンドラーとの併用テスト

#### フェーズ2: 設定管理の統合
1. `configManager.js` を作成 ✅
2. 既存の設定処理を段階的に移行
3. データ形式の統一

#### フェーズ3: ID管理の統合
1. `idManager.js` を作成 ✅
2. customId生成ルールの統一
3. 命名規則の正規化

#### フェーズ4: 削除可能ファイルの整理
1. 重複ファイルの削除
2. 使用されていないヘルパーの削除

## 実装例

### index.js での使用

```javascript
// 従来
const { handleButton } = require('./utils/buttonsHandler');
const { handleModal } = require('./utils/modalsHandler');
const { handleSelect } = require('./utils/selectsHandler');

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    await handleButton(interaction);
  } else if (interaction.isStringSelectMenu()) {
    await handleSelect(interaction);
  } else if (interaction.isModalSubmit()) {
    await handleModal(interaction);
  }
});

// 統合後
const { unifiedHandler } = require('./utils/unifiedInteractionHandler');

client.on('interactionCreate', async interaction => {
  await unifiedHandler.handleInteraction(interaction);
});
```

### 設定管理の統合

```javascript
// 従来（分散）
const { ensureGuildJSON, readJSON, writeJSON } = require('./fileHelper');
const jsonPath = ensureGuildJSON(guildId);
const json = readJSON(jsonPath);
if (!json.totusuna) json.totusuna = {};
writeJSON(jsonPath, json);

// 統合後
const { configManager } = require('./utils/configManager');
const totusunaConfig = configManager.getSectionConfig(guildId, 'totusuna');
configManager.updateSectionConfig(guildId, 'totusuna', newConfig);
```

### ID管理の統合

```javascript
// 従来（分散）
const uuid = uuidv4();
const buttonId = `totsusuna_report_button_${uuid}`;
const modalId = `totusuna_modal:${uuid}`;

// 統合後
const { idManager } = require('./utils/idManager');
const uuid = idManager.generateUUID();
const buttonId = idManager.createButtonId('totusuna_report', 'report', uuid);
const modalId = idManager.createModalId('totusuna_report', 'report', uuid);
```

## 削除可能なファイル（統合後）

### 即座に削除可能
- `utils/interactionHandler.js` (空ファイル)

### 段階的に削除可能
1. **第1段階**
   - `utils/buttonsHandler.js` → `unifiedInteractionHandler.js`
   - `utils/modalsHandler.js` → `unifiedInteractionHandler.js`
   - `utils/selectsHandler.js` → `unifiedInteractionHandler.js`

2. **第2段階**
   - 重複する `selects/index.js` や `selects/handleSelect.js`
   - 機能別の `buttons.js`, `modals.js`, `selects.js` （カテゴリ統合後）

3. **第3段階**
   - 設定管理の重複部分
   - 使用されていないヘルパー関数

## 移行時の注意点

1. **後方互換性の保持**
   - 既存のcustomIdは引き続きサポート
   - 段階的な移行により影響を最小化

2. **テストの実施**
   - 各機能の動作確認
   - エラーハンドリングの検証

3. **ログ出力の統一**
   - エラーメッセージの形式統一
   - デバッグ情報の充実

## 期待される効果

1. **コード量の削減** - 重複コードの除去により約30%削減
2. **保守性の向上** - 単一箇所での修正で全体に反映
3. **エラーハンドリングの統一** - 一貫したエラー処理
4. **新機能追加の簡易化** - 統一されたパターンでの開発
