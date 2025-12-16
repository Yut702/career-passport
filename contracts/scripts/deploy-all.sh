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
echo "ℹ️  毎回新しい状態でデプロイします（状態は保持されません）"
echo ""

# 1. NonFungibleCareerNFT をデプロイ
echo "1. NonFungibleCareerNFT をデプロイ中..."
forge script script/DeployNFT.s.sol:DeployNFT \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  --chain-id "$CHAIN_ID"

echo ""

# 2. StampManager と CareerStampSFT をデプロイ
echo "2. StampManager と CareerStampSFT をデプロイ中..."
forge script script/DeployStamp.s.sol:DeployStamp \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  --chain-id "$CHAIN_ID"

echo ""

# 3. デプロイ済みアドレスを保存
echo "3. デプロイ済みアドレスを保存中..."
CHAIN_ID="$CHAIN_ID" bash scripts/save-deployed-addresses.sh

# 4. コントラクト間の設定
echo ""
echo "4. コントラクト間の設定中..."
echo "   - NFTコントラクトの所有者をStampManagerに設定"
echo "   - StampManagerにNFTコントラクトのアドレスを設定"
CHAIN_ID="$CHAIN_ID" bash scripts/setup-contracts.sh

# 5. 環境変数ファイルを生成
echo ""
echo "5. 環境変数ファイルを生成中..."
CHAIN_ID="$CHAIN_ID" bash scripts/generate-env.sh

# 6. バックエンドデータベーステーブルの作成（オプション）
echo ""
echo "6. バックエンドデータベーステーブルを作成中..."
if [ -d "../backend" ]; then
  cd ../backend
  if [ -f "package.json" ]; then
    # DynamoDB Localが起動しているか確認
    if curl -s http://localhost:8000 > /dev/null 2>&1; then
      echo "   DynamoDB Local に接続中..."
      npm run create-api-tables 2>/dev/null || echo "   ⚠️  テーブル作成をスキップ（既に存在するか、DynamoDB Localが起動していません）"
    else
      echo "   ⚠️  DynamoDB Local が起動していません。テーブル作成をスキップします"
      echo "   テーブルを作成するには: cd backend && npm run create-api-tables"
    fi
  fi
  cd ../contracts
else
  echo "   ⚠️  backend ディレクトリが見つかりません。テーブル作成をスキップします"
fi

echo ""
echo "=== デプロイ完了 ==="
echo ""
echo "次のステップ:"
echo "1. deployed.json にコントラクトアドレスが記録されました"
echo "2. コントラクト間の設定が完了しました"
echo "3. frontend/.env.local に環境変数が設定されました"
echo "4. フロントエンドでこれらのアドレスを使用できます"
echo "5. バックエンドデータベーステーブルが作成されました（DynamoDB Localが起動している場合）"


