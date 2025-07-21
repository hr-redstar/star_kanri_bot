#!/bin/bash

# --- Configuration ---
set -e # Exit immediately if a command exits with a non-zero status.

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="$HOME/star_kanri_bot"

# --- Error Handling ---
handle_error() {
    local exit_code=$?
    echo -e "\n${RED}❌ エラーが発生しました (終了コード: $exit_code, 行番号: $1)。処理を中止します。${NC}"
    echo "💡 エラーの原因によっては、'./sync_from_github.sh' を直接実行することで解決する場合があります。"
    exit $exit_code
}
trap 'handle_error $LINENO' ERR

echo -e "${YELLOW}--- STAR管理Bot 緊急更新スクリプト ---${NC}"

# --- 1. Pre-flight Checks ---
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}❌ プロジェクトディレクトリが見つかりません: $PROJECT_DIR${NC}"
  echo "💡 'init_server.sh' を使って初回セットアップを行ってください。"
  exit 1
fi
cd "$PROJECT_DIR"
echo "🎯 ローカルの変更を破棄し、GitHubの最新版に強制同期します。"
read -p "続行してもよろしいですか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "処理を中止しました。"
    exit 1
fi

# --- 1. Force Sync with GitHub (using the dedicated script) ---
echo -e "\n${YELLOW}1. GitHubリポジトリと安全に強制同期しています...${NC}"
if [ ! -f "./sync_from_github.sh" ]; then
    echo -e "${RED}❌ 同期スクリプト './sync_from_github.sh' が見つかりません。${NC}"
    exit 1
fi
./sync_from_github.sh --force # --force flag to skip interactive prompt

# --- 2. Install Dependencies & Deploy Commands ---
echo -e "\n${YELLOW}2. 依存関係のインストールとコマンドのデプロイ...${NC}"
echo "📦 npm パッケージをインストール中..."
npm install --no-audit --no-fund

echo "📡 スラッシュコマンドをDiscordに登録中..."
node devcmdup.js

# --- スクリプト権限の確認 ---
# --- 3. Restart PM2 Process ---
echo -e "\n${YELLOW}3. Botプロセスを再起動しています...${NC}"
if command -v pm2 &> /dev/null && pm2 list | grep -q "star-kanri-bot"; then
  pm2 restart star-kanri-bot
  pm2 save
  echo -e "${GREEN}✅ Botが正常に再起動されました。${NC}"
else
  echo -e "${YELLOW}⚠️ PM2プロセスが見つかりません。手動で起動してください:${NC}"
  echo "   cd $PROJECT_DIR && pm2 start ecosystem.config.js"
fi

# --- 4. Final Message ---
echo -e "\n${GREEN}🎉 緊急更新がすべて完了しました！${NC}"
echo "💡 Botの状態は 'pm2 status' または 'pm2 logs star-kanri-bot' で確認できます。"
echo "💡 より詳細なオプションを持つ更新は './update.sh' を使用してください。"
