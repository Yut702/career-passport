#!/bin/bash

# すべてのコントラクトをデプロイし、アドレスを自動的に記録するスクリプト

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

# デフォルト値
RPC_URL=${RPC_URL:-"http://localhost:8545"}
PRIVATE_KEY=${PRIVATE_KEY:-"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"}
CHAIN_ID=${CHAIN_ID:-31337}

echo "=== コントラクトデプロイ開始 ==="
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo ""

# CareerPassportNFT をデプロイ
echo "1. CareerPassportNFT をデプロイ中..."
forge script script/DeployNFT.s.sol:DeployNFT \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  --chain-id "$CHAIN_ID"

echo ""

# StampManager をデプロイ
echo "2. StampManager をデプロイ中..."
forge script script/DeployStamp.s.sol:DeployStamp \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  --chain-id "$CHAIN_ID"

echo ""

# デプロイ済みアドレスを保存
echo "3. デプロイ済みアドレスを保存中..."
CHAIN_ID="$CHAIN_ID" bash scripts/save-deployed-addresses.sh

# 環境変数ファイルを生成
echo ""
echo "4. 環境変数ファイルを生成中..."
CHAIN_ID="$CHAIN_ID" bash scripts/generate-env.sh

echo ""
echo "=== デプロイ完了 ==="
echo ""
echo "次のステップ:"
echo "1. deployed.json にコントラクトアドレスが記録されました"
echo "2. frontend/.env.local に環境変数が設定されました"
echo "3. フロントエンドでこれらのアドレスを使用できます"

