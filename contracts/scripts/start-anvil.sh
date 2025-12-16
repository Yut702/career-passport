#!/bin/bash

# Anvilを起動するスクリプト（毎回新しい状態で起動）
# 注意: このスクリプトは状態を保持しません。毎回新しい状態で起動します。

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

# 設定
RPC_URL="http://127.0.0.1:8545"
CHAIN_ID=31337
PORT=8545

echo "=== Anvil 起動 ==="
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo "Port: $PORT"
echo ""
echo "ℹ️  毎回新しい状態で起動します（状態は保持されません）"
echo ""
echo "Anvilを起動しています..."
echo "停止するには Ctrl+C を押してください。"
echo ""

# Anvilを起動（状態ファイルは使用しない）
anvil \
  --host 127.0.0.1 \
  --port "$PORT" \
  --chain-id "$CHAIN_ID"

