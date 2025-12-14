#!/bin/bash

# Anvilを状態保存付きで起動するスクリプト
# このスクリプトを使用することで、Anvilを再起動しても以前の状態が保持されます

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

# 設定
STATE_FILE="anvil-state.json"
RPC_URL="http://127.0.0.1:8545"
CHAIN_ID=31337
PORT=8545

echo "=== Anvil 起動 ==="
echo "状態ファイル: $STATE_FILE"
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo "Port: $PORT"
echo ""

# 状態ファイルが存在する場合は、その旨を表示
if [ -f "$STATE_FILE" ]; then
  echo "✅ 既存の状態ファイルが見つかりました。以前の状態を復元します。"
  echo "   ファイルサイズ: $(du -h "$STATE_FILE" | cut -f1)"
else
  echo "ℹ️  新しい状態で起動します。"
fi

echo ""
echo "Anvilを起動しています..."
echo "停止するには Ctrl+C を押してください。"
echo ""

# Anvilを起動
anvil \
  --state "$STATE_FILE" \
  --host 127.0.0.1 \
  --port "$PORT" \
  --chain-id "$CHAIN_ID"

