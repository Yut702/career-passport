#!/bin/bash

# シンプルなAPIテストスクリプト

BASE_URL="http://localhost:3000/api"
WALLET_STUDENT="0x1111111111111111111111111111111111111111"
WALLET_ORG="0x2222222222222222222222222222222222222222"
EVENT_ID="event-123"

echo "=== バックエンドAPI動作確認テスト ==="
echo ""

# テスト1: イベント応募
echo "[テスト1] イベントに応募"
curl -s -X POST "${BASE_URL}/events/${EVENT_ID}/apply" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"${WALLET_STUDENT}\",\"applicationText\":\"応募動機です\"}" \
  | head -20
echo ""
echo ""

# テスト2: 応募一覧取得
echo "[テスト2] 自分の応募一覧を取得"
curl -s "${BASE_URL}/events/applications?walletAddress=${WALLET_STUDENT}" | head -20
echo ""
echo ""

# テスト3: メッセージ送信
echo "[テスト3] メッセージを送信"
curl -s -X POST "${BASE_URL}/messages" \
  -H "Content-Type: application/json" \
  -d "{\"senderAddress\":\"${WALLET_STUDENT}\",\"receiverAddress\":\"${WALLET_ORG}\",\"content\":\"こんにちは\"}" \
  | head -20
echo ""
echo ""

# テスト4: 会話一覧取得
echo "[テスト4] 会話一覧を取得"
curl -s "${BASE_URL}/messages/conversations?walletAddress=${WALLET_STUDENT}" | head -20
echo ""
echo ""

# テスト5: マッチング作成
echo "[テスト5] マッチングを作成"
curl -s -X POST "${BASE_URL}/matches" \
  -H "Content-Type: application/json" \
  -d "{\"studentAddress\":\"${WALLET_STUDENT}\",\"orgAddress\":\"${WALLET_ORG}\"}" \
  | head -20
echo ""
echo ""

# テスト6: マッチング一覧取得
echo "[テスト6] 学生のマッチング一覧を取得"
curl -s "${BASE_URL}/matches/student?walletAddress=${WALLET_STUDENT}" | head -20
echo ""
echo ""

echo "=== テスト完了 ==="

