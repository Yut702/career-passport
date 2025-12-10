#!/bin/bash

# デプロイされたコントラクトアドレスを deployed.json に保存するスクリプト

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

# チェーンID（デフォルトは31337 = Anvil）
CHAIN_ID=${CHAIN_ID:-31337}

# deployed.json ファイルのパス
DEPLOYED_JSON="deployed.json"

# deployed.json が存在しない場合は作成
if [ ! -f "$DEPLOYED_JSON" ]; then
    echo "{}" > "$DEPLOYED_JSON"
fi

# jq がインストールされているか確認
if ! command -v jq &> /dev/null; then
    echo "エラー: jq がインストールされていません。"
    echo "macOS: brew install jq"
    echo "Ubuntu/Debian: sudo apt-get install jq"
    exit 1
fi

# CareerPassportNFT のアドレスを取得
NFT_BROADCAST_FILE="broadcast/DeployNFT.s.sol/${CHAIN_ID}/run-latest.json"
if [ -f "$NFT_BROADCAST_FILE" ]; then
    NFT_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "CareerPassportNFT") | .contractAddress' "$NFT_BROADCAST_FILE" | head -1)
    if [ -n "$NFT_ADDRESS" ] && [ "$NFT_ADDRESS" != "null" ]; then
        echo "CareerPassportNFT アドレスを取得: $NFT_ADDRESS"
        # jq を使用して JSON を更新
        jq --arg chain_id "$CHAIN_ID" --arg address "$NFT_ADDRESS" \
           '.[$chain_id].CareerPassportNFT = $address' "$DEPLOYED_JSON" > "${DEPLOYED_JSON}.tmp" && \
           mv "${DEPLOYED_JSON}.tmp" "$DEPLOYED_JSON"
    else
        echo "警告: CareerPassportNFT のアドレスが見つかりませんでした"
    fi
else
    echo "警告: $NFT_BROADCAST_FILE が見つかりませんでした"
fi

# StampManager のアドレスを取得
STAMP_BROADCAST_FILE="broadcast/DeployStamp.s.sol/${CHAIN_ID}/run-latest.json"
if [ -f "$STAMP_BROADCAST_FILE" ]; then
    STAMP_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "StampManager") | .contractAddress' "$STAMP_BROADCAST_FILE" | head -1)
    if [ -n "$STAMP_ADDRESS" ] && [ "$STAMP_ADDRESS" != "null" ]; then
        echo "StampManager アドレスを取得: $STAMP_ADDRESS"
        # jq を使用して JSON を更新
        jq --arg chain_id "$CHAIN_ID" --arg address "$STAMP_ADDRESS" \
           '.[$chain_id].StampManager = $address' "$DEPLOYED_JSON" > "${DEPLOYED_JSON}.tmp" && \
           mv "${DEPLOYED_JSON}.tmp" "$DEPLOYED_JSON"
    else
        echo "警告: StampManager のアドレスが見つかりませんでした"
    fi
else
    echo "警告: $STAMP_BROADCAST_FILE が見つかりませんでした"
fi

echo ""
echo "デプロイ済みアドレスを $DEPLOYED_JSON に保存しました:"
cat "$DEPLOYED_JSON" | jq .

