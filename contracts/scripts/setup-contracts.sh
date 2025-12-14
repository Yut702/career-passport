#!/bin/bash

# コントラクト間の設定を行うスクリプト
# NFTコントラクトの所有者をStampManagerに設定し、StampManagerにNFTコントラクトのアドレスを設定

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

# デフォルト値
RPC_URL=${RPC_URL:-"http://localhost:8545"}
PRIVATE_KEY=${PRIVATE_KEY:-"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"}
CHAIN_ID=${CHAIN_ID:-31337}

# deployed.jsonからアドレスを取得
DEPLOYED_JSON="deployed.json"

if [ ! -f "$DEPLOYED_JSON" ]; then
    echo "エラー: $DEPLOYED_JSON が見つかりません。"
    echo "まず、デプロイを実行してください。"
    exit 1
fi

# jq がインストールされているか確認
if ! command -v jq &> /dev/null; then
    echo "エラー: jq がインストールされていません。"
    exit 1
fi

NFT_ADDRESS=$(jq -r ".[\"$CHAIN_ID\"].NonFungibleCareerNFT" "$DEPLOYED_JSON")
STAMP_ADDRESS=$(jq -r ".[\"$CHAIN_ID\"].StampManager" "$DEPLOYED_JSON")

if [ "$NFT_ADDRESS" == "null" ] || [ -z "$NFT_ADDRESS" ]; then
    echo "エラー: NonFungibleCareerNFT のアドレスが見つかりませんでした"
    exit 1
fi

if [ "$STAMP_ADDRESS" == "null" ] || [ -z "$STAMP_ADDRESS" ]; then
    echo "エラー: StampManager のアドレスが見つかりませんでした"
    exit 1
fi

echo "=== コントラクト間の設定 ==="
echo "NFT Contract: $NFT_ADDRESS"
echo "StampManager: $STAMP_ADDRESS"
echo ""

# 現在の所有者を確認
CURRENT_OWNER=$(cast call "$NFT_ADDRESS" "owner()" --rpc-url "$RPC_URL" | cast parse-bytes32-address)
echo "NFTコントラクトの現在の所有者: $CURRENT_OWNER"
echo "StampManagerアドレス: $STAMP_ADDRESS"
echo ""

# 1. NFTコントラクトの所有者をStampManagerに設定（既に設定されている場合はスキップ）
if [ "$CURRENT_OWNER" != "$STAMP_ADDRESS" ]; then
    echo "1. NFTコントラクトの所有者をStampManagerに設定中..."
    # 現在の所有者からtransferOwnershipを呼び出す必要がある
    # デプロイ時に使用したアカウント（PRIVATE_KEYに対応するアドレス）が所有者であることを確認
    DEPLOYER_ADDRESS=$(cast wallet address --private-key "$PRIVATE_KEY")
    echo "デプロイアカウント: $DEPLOYER_ADDRESS"
    
    if [ "$CURRENT_OWNER" == "$DEPLOYER_ADDRESS" ]; then
        cast send "$NFT_ADDRESS" \
          "transferOwnership(address)" \
          "$STAMP_ADDRESS" \
          --rpc-url "$RPC_URL" \
          --private-key "$PRIVATE_KEY" \
          --chain-id "$CHAIN_ID"
        echo "✅ 所有者の移譲が完了しました"
    else
        echo "⚠️  警告: デプロイアカウントが所有者ではありません。"
        echo "   現在の所有者 ($CURRENT_OWNER) から手動で transferOwnership を実行してください。"
        echo "   または、既に設定が完了している場合は、この警告を無視して続行できます。"
    fi
else
    echo "✅ NFTコントラクトの所有者は既にStampManagerに設定されています"
fi

echo ""

# 2. StampManagerにNFTコントラクトのアドレスを設定（既に設定されている場合はスキップ）
CURRENT_NFT_CONTRACT=$(cast call "$STAMP_ADDRESS" "nftContract()" --rpc-url "$RPC_URL" | cast parse-bytes32-address)
echo "StampManagerに設定されているNFTコントラクト: $CURRENT_NFT_CONTRACT"
echo "設定しようとしているNFTコントラクト: $NFT_ADDRESS"
echo ""

if [ "$CURRENT_NFT_CONTRACT" == "$NFT_ADDRESS" ]; then
    echo "✅ StampManagerにNFTコントラクトのアドレスは既に設定されています"
else
    echo "2. StampManagerにNFTコントラクトのアドレスを設定中..."
    cast send "$STAMP_ADDRESS" \
      "setNftContract(address)" \
      "$NFT_ADDRESS" \
      --rpc-url "$RPC_URL" \
      --private-key "$PRIVATE_KEY" \
      --chain-id "$CHAIN_ID"
    echo "✅ NFTコントラクトのアドレスを設定しました"
fi

echo ""
echo "=== 設定完了 ==="

