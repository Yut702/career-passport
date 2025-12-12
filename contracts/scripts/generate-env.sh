#!/bin/bash

# deployed.jsonから環境変数ファイルを生成するスクリプト

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

# deployed.json ファイルのパス
DEPLOYED_JSON="deployed.json"
ENV_FILE="../frontend/.env.local"

# jq がインストールされているか確認
if ! command -v jq &> /dev/null; then
    echo "エラー: jq がインストールされていません。"
    echo "macOS: brew install jq"
    echo "Ubuntu/Debian: sudo apt-get install jq"
    exit 1
fi

# deployed.json が存在するか確認
if [ ! -f "$DEPLOYED_JSON" ]; then
    echo "エラー: $DEPLOYED_JSON が見つかりません。"
    echo "まず、デプロイを実行してアドレスを記録してください。"
    exit 1
fi

# チェーンID（デフォルトは31337 = Anvil）
CHAIN_ID=${CHAIN_ID:-31337}

# アドレスを取得
NFT_ADDRESS=$(jq -r ".[\"$CHAIN_ID\"].NonFungibleCareerNFT" "$DEPLOYED_JSON")
STAMP_ADDRESS=$(jq -r ".[\"$CHAIN_ID\"].StampManager" "$DEPLOYED_JSON")

# アドレスが取得できたか確認
if [ "$NFT_ADDRESS" == "null" ] || [ -z "$NFT_ADDRESS" ]; then
    echo "警告: NonFungibleCareerNFT のアドレスが見つかりませんでした"
    NFT_ADDRESS=""
fi

if [ "$STAMP_ADDRESS" == "null" ] || [ -z "$STAMP_ADDRESS" ]; then
    echo "警告: StampManager のアドレスが見つかりませんでした"
    STAMP_ADDRESS=""
fi

# 注意: スタンプ（SFT）はStampManager経由でアクセスするため、SFTコントラクトの環境変数は不要

# RPC URLとチェーンIDを設定
RPC_URL="http://localhost:8545"

# 環境変数ファイルを作成
cat > "$ENV_FILE" << EOF
# コントラクトアドレス（Chain ID: $CHAIN_ID）
VITE_NFT_CONTRACT_ADDRESS=$NFT_ADDRESS
VITE_STAMP_MANAGER_ADDRESS=$STAMP_ADDRESS
# 注意: スタンプ（SFT）はStampManager経由でアクセスするため、SFTコントラクトの環境変数は不要
VITE_RPC_URL=$RPC_URL
VITE_CHAIN_ID=$CHAIN_ID
EOF

echo "環境変数ファイルを生成しました: $ENV_FILE"
echo ""
echo "内容:"
cat "$ENV_FILE"

