#!/bin/bash

#
# pre-flight-check.sh - スクリプト実行前の基本的な環境チェック
#

# --- Configuration ---
set -e # Exit immediately if a command exits with a non-zero status.

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "✈️  実行前チェックを開始します..."

error_found=false

# 1. 必須コマンドの存在チェック
for tool in git node npm; do
  if ! command -v "$tool" &> /dev/null; then
    echo -e "  ${RED}❌ 必須コマンドが見つかりません: $tool${NC}"
    error_found=true
  fi
done

# 2. 必須ファイルの存在チェック
if [ ! -f "package.json" ]; then
  echo -e "  ${RED}❌ 必須ファイルが見つかりません: package.json${NC}"
  error_found=true
fi

if [ ! -f ".env" ]; then
  echo -e "  ${RED}❌ 設定ファイルが見つかりません: .env${NC}"
  echo "  💡 '.env.sample' をコピーして '.env' を作成し、トークン等を設定してください。"
  error_found=true
else
  # 3. .envファイル内のDISCORD_TOKENチェック
  if ! grep -q "DISCORD_TOKEN=.*[^ ]" ".env"; then
    echo -e "  ${RED}❌ .envファイルにDISCORD_TOKENが設定されていません。${NC}"
    error_found=true
  fi
fi

if [ "$error_found" = true ]; then
  echo -e "\n${RED}チェックで問題が検出されたため、処理を中止します。${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 環境チェック完了。問題ありません。${NC}"