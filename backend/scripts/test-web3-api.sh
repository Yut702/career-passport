#!/bin/bash

# テストスクリプト：Web3 Backend API テスト

echo "🧪 Web3 Backend API テスト開始"
echo "================================"

BASE_URL="http://localhost:3000/api"

# テスト1: ヘルスチェック
echo ""
echo "1️⃣  ヘルスチェック"
curl -s ${BASE_URL}/../health | jq . || echo "❌ ヘルスチェック失敗"

# テスト2: ウォレットアドレステスト用定数
WALLET="0x1234567890123456789012345678901234567890"
ORG_ADDRESS="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"

echo ""
echo "2️⃣  テスト用データ"
echo "Wallet: $WALLET"
echo "Org: $ORG_ADDRESS"

# テスト3: ユーザープロフィール取得（存在しない場合は404）
echo ""
echo "3️⃣  ユーザープロフィール取得（未登録）"
curl -s -X GET "${BASE_URL}/auth/user-profile/${WALLET}" | jq .

# テスト4: スタンプ一覧取得（初期状態は空）
echo ""
echo "4️⃣  スタンプ一覧取得（初期状態）"
curl -s -X GET "${BASE_URL}/stamps/user/${WALLET}" | jq .

# テスト5: NFT一覧取得（初期状態は空）
echo ""
echo "5️⃣  NFT一覧取得（初期状態）"
curl -s -X GET "${BASE_URL}/nfts/user/${WALLET}" | jq .

# テスト6: イベント一覧取得（初期状態は空）
echo ""
echo "6️⃣  イベント一覧取得（初期状態）"
curl -s -X GET "${BASE_URL}/events" | jq .

# テスト7: スタンプ発行テスト
echo ""
echo "7️⃣  スタンプ発行（テスト）"
STAMP_PAYLOAD='{
  "userWalletAddress": "'${WALLET}'",
  "organizationAddress": "'${ORG_ADDRESS}'",
  "category": "internship",
  "imageUrl": "https://example.com/stamp.png",
  "description": "Summer internship 2025",
  "certificateCategory": "internship",
  "issuerName": "TechCorp",
  "issuedDate": "2025-12-11T00:00:00Z"
}'
echo "$STAMP_PAYLOAD" | curl -s -X POST "${BASE_URL}/stamps/issue" \
  -H "Content-Type: application/json" \
  -d @- | jq .

# テスト8: スタンプ一覧取得（発行後）
echo ""
echo "8️⃣  スタンプ一覧取得（発行後）"
curl -s -X GET "${BASE_URL}/stamps/user/${WALLET}" | jq .

# テスト9: イベント作成
echo ""
echo "9️⃣  イベント作成（テスト）"
EVENT_PAYLOAD='{
  "eventId": "event_tech2025",
  "organizationAddress": "'${ORG_ADDRESS}'",
  "eventName": "Tech Summit 2025",
  "eventDescription": "Annual tech conference",
  "eventDate": "2025-12-20",
  "location": "Tokyo, Japan",
  "imageUrl": "https://example.com/event.png",
  "maxParticipants": 100
}'
echo "$EVENT_PAYLOAD" | curl -s -X POST "${BASE_URL}/events" \
  -H "Content-Type: application/json" \
  -d @- | jq .

# テスト10: イベント一覧取得
echo ""
echo "🔟 イベント一覧取得"
curl -s -X GET "${BASE_URL}/events" | jq .

echo ""
echo "================================"
echo "✅ テスト完了"
