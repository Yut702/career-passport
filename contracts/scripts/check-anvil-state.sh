#!/bin/bash

# Anvilの状態とコントラクトアドレスの整合性を確認するスクリプト

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

RPC_URL="http://localhost:8545"
DEPLOYED_JSON="deployed.json"

echo "=== Anvil状態とコントラクトアドレスの確認 ==="
echo ""

# Anvilが起動しているか確認
if ! curl -s "$RPC_URL" > /dev/null 2>&1; then
    echo "❌ エラー: Anvilが起動していません"
    echo "   まず、bash scripts/start-anvil.sh でAnvilを起動してください"
    exit 1
fi

echo "✅ Anvilは起動しています"
echo ""

# deployed.jsonからコントラクトアドレスを取得
if [ ! -f "$DEPLOYED_JSON" ]; then
    echo "❌ エラー: $DEPLOYED_JSON が見つかりません"
    exit 1
fi

NFT_ADDRESS=$(jq -r '.["31337"].NonFungibleCareerNFT' "$DEPLOYED_JSON" 2>/dev/null || echo "")
STAMP_ADDRESS=$(jq -r '.["31337"].StampManager' "$DEPLOYED_JSON" 2>/dev/null || echo "")

echo "deployed.json に記録されているアドレス:"
echo "  NonFungibleCareerNFT: $NFT_ADDRESS"
echo "  StampManager: $STAMP_ADDRESS"
echo ""

# コントラクトが実際に存在するか確認
check_contract() {
    local address=$1
    local name=$2
    
    if [ -z "$address" ] || [ "$address" == "null" ]; then
        echo "  ❌ $name: アドレスが設定されていません"
        return 1
    fi
    
    CODE=$(curl -s -X POST "$RPC_URL" \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$address\",\"latest\"],\"id\":1}" \
        | jq -r '.result' 2>/dev/null || echo "")
    
    if [ -z "$CODE" ] || [ "$CODE" == "null" ] || [ "$CODE" == "0x" ]; then
        echo "  ❌ $name ($address): コントラクトが存在しません"
        return 1
    else
        echo "  ✅ $name ($address): コントラクトが存在します"
        return 0
    fi
}

echo "Anvil上のコントラクト存在確認:"
check_contract "$NFT_ADDRESS" "NonFungibleCareerNFT"
check_contract "$STAMP_ADDRESS" "StampManager"
echo ""

# 環境変数ファイルの確認
ENV_FILE="../frontend/.env.local"
if [ -f "$ENV_FILE" ]; then
    echo "frontend/.env.local の内容:"
    ENV_NFT=$(grep "VITE_NFT_CONTRACT_ADDRESS" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    ENV_STAMP=$(grep "VITE_STAMP_MANAGER_ADDRESS" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    echo "  VITE_NFT_CONTRACT_ADDRESS=$ENV_NFT"
    echo "  VITE_STAMP_MANAGER_ADDRESS=$ENV_STAMP"
    echo ""
    
    # アドレスの一致確認
    if [ "$NFT_ADDRESS" != "$ENV_NFT" ]; then
        echo "  ⚠️  警告: NonFungibleCareerNFTのアドレスが一致しません"
        echo "     deployed.json: $NFT_ADDRESS"
        echo "     .env.local: $ENV_NFT"
    fi
    
    if [ "$STAMP_ADDRESS" != "$ENV_STAMP" ]; then
        echo "  ⚠️  警告: StampManagerのアドレスが一致しません"
        echo "     deployed.json: $STAMP_ADDRESS"
        echo "     .env.local: $ENV_STAMP"
    fi
else
    echo "⚠️  警告: $ENV_FILE が見つかりません"
fi

echo ""
echo "=== 確認完了 ==="
echo ""
echo "問題がある場合の対処法:"
echo "1. コントラクトが存在しない場合:"
echo "   bash scripts/deploy-all.sh を実行してコントラクトを再デプロイ"
echo ""
echo "2. アドレスが一致しない場合:"
echo "   bash scripts/generate-env.sh を実行して環境変数ファイルを再生成"
echo ""
echo "3. Anvilの状態をリセットしたい場合:"
echo "   bash scripts/reset-anvil.sh を実行（注意: すべてのデータが失われます）"

