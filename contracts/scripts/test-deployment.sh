#!/bin/bash

# コントラクトアドレス（deployed.jsonから自動取得）
cd "$(dirname "$0")/.."
STAMP_MANAGER=$(jq -r '.["31337"].StampManager' deployed.json)
NFT_CONTRACT=$(jq -r '.["31337"].CareerPassportNFT' deployed.json)
USER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC_URL="http://localhost:8545"

echo "=== スタンプ発行テスト ==="
cast send "$STAMP_MANAGER" \
  "issueStamp(address,string,string,string)" \
  "$USER_ADDRESS" \
  "優秀な成績" \
  "東京大学" \
  "学業" \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY"

echo "=== スタンプ数確認 ==="
cast call "$STAMP_MANAGER" \
  "getOrganizationStampCount(address,string)" \
  "$USER_ADDRESS" \
  "東京大学" \
  --rpc-url "$RPC_URL"

echo "=== NFT発行テスト ==="
# mintトランザクションを実行し、エラーをチェック
if ! cast send "$NFT_CONTRACT" \
  "mint(address,string,string,string,string[])" \
  "$USER_ADDRESS" \
  "https://example.com/metadata.json" \
  "優秀な成績証明書" \
  "Rare" \
  '["東京大学"]' \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" 2>&1; then
  echo "エラー: mintが失敗しました。以下を確認してください："
  echo "1. コントラクトの所有者か確認: cast call \"$NFT_CONTRACT\" \"owner()\" --rpc-url \"$RPC_URL\""
  echo "2. プライベートキーが正しいか確認"
  echo "3. Anvilが起動しているか確認: curl http://localhost:8545"
  exit 1
fi

# mintが成功したことを確認するため、少し待つ（Anvilでは通常不要だが、念のため）
sleep 1

echo "=== 総供給量確認 ==="
TOTAL_SUPPLY=$(cast call "$NFT_CONTRACT" \
  "getTotalSupply()" \
  --rpc-url "$RPC_URL")

echo "Total Supply: $TOTAL_SUPPLY"

# 総供給量が0の場合はエラー
if [ "$TOTAL_SUPPLY" = "0" ] || [ -z "$TOTAL_SUPPLY" ]; then
  echo "エラー: NFTがまだ発行されていません。mintが成功したか確認してください。"
  echo "デバッグ手順:"
  echo "1. mintトランザクションが成功したか確認"
  echo "2. コントラクトアドレスが正しいか確認: echo \"$NFT_CONTRACT\""
  echo "3. コントラクトの所有者を確認: cast call \"$NFT_CONTRACT\" \"owner()\" --rpc-url \"$RPC_URL\""
  echo "4. 実行しているアドレスを確認: cast wallet address --private-key \"$PRIVATE_KEY\""
  exit 1
fi

# 発行されたトークンIDを計算（総供給量 - 1）
# 最初のmintではトークンID 0が発行される（総供給量が1の場合）
TOKEN_ID=$((TOTAL_SUPPLY - 1))
echo "使用するトークンID: $TOKEN_ID"

# トークンIDが有効か確認（0以上、総供給量未満）
if [ "$TOKEN_ID" -lt 0 ] || [ "$TOKEN_ID" -ge "$TOTAL_SUPPLY" ]; then
  echo "エラー: 無効なトークンID: $TOKEN_ID (総供給量: $TOTAL_SUPPLY)"
  exit 1
fi

echo "=== NFT情報確認 ==="
# トークン情報を取得（エラーハンドリング付き）
if ! cast call "$NFT_CONTRACT" \
  "tokenURI(uint256)" \
  "$TOKEN_ID" \
  --rpc-url "$RPC_URL" 2>&1; then
  echo "エラー: tokenURIの取得に失敗しました。トークンID $TOKEN_ID が存在しない可能性があります。"
  exit 1
fi

if ! cast call "$NFT_CONTRACT" \
  "getTokenName(uint256)" \
  "$TOKEN_ID" \
  --rpc-url "$RPC_URL" 2>&1; then
  echo "エラー: getTokenNameの取得に失敗しました。トークンID $TOKEN_ID が存在しない可能性があります。"
  exit 1
fi

echo ""
echo "=== テスト完了 ==="

