#!/bin/bash

# バックエンドAPIのテストスクリプト

BASE_URL="http://localhost:3000/api"
WALLET_STUDENT="0x1111111111111111111111111111111111111111"
WALLET_ORG="0x2222222222222222222222222222222222222222"
EVENT_ID="event-123"

echo "=== バックエンドAPI動作確認テスト ==="
echo ""

# 1. イベント応募APIのテスト
echo "1. イベント応募APIのテスト"
echo "---------------------------"

echo "1-1. イベントに応募"
RESPONSE=$(curl -s -X POST "${BASE_URL}/events/${EVENT_ID}/apply" \
  -H "Content-Type: application/json" \
  -d "{
    \"walletAddress\": \"${WALLET_STUDENT}\",
    \"applicationText\": \"応募動機です\"
  }")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

echo "1-2. 自分の応募一覧を取得"
RESPONSE=$(curl -s "${BASE_URL}/events/applications?walletAddress=${WALLET_STUDENT}")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

echo "1-3. イベントの応募一覧を取得（企業向け）"
RESPONSE=$(curl -s "${BASE_URL}/events/${EVENT_ID}/applications")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# 2. メッセージAPIのテスト
echo "2. メッセージAPIのテスト"
echo "---------------------------"

echo "2-1. メッセージを送信"
RESPONSE=$(curl -s -X POST "${BASE_URL}/messages" \
  -H "Content-Type: application/json" \
  -d "{
    \"senderAddress\": \"${WALLET_STUDENT}\",
    \"receiverAddress\": \"${WALLET_ORG}\",
    \"content\": \"こんにちは、インターンシップに興味があります。\"
  }")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
MESSAGE_ID=$(echo "$RESPONSE" | jq -r '.message.messageId' 2>/dev/null)
echo ""

echo "2-2. 会話一覧を取得"
RESPONSE=$(curl -s "${BASE_URL}/messages/conversations?walletAddress=${WALLET_STUDENT}")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
CONVERSATION_ID=$(echo "$RESPONSE" | jq -r '.conversations[0].conversationId' 2>/dev/null)
echo ""

if [ -n "$CONVERSATION_ID" ] && [ "$CONVERSATION_ID" != "null" ]; then
  echo "2-3. 会話のメッセージ一覧を取得"
  RESPONSE=$(curl -s "${BASE_URL}/messages/conversations/${CONVERSATION_ID}")
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  echo ""
fi

if [ -n "$MESSAGE_ID" ] && [ "$MESSAGE_ID" != "null" ]; then
  echo "2-4. メッセージを既読にする"
  RESPONSE=$(curl -s -X PATCH "${BASE_URL}/messages/${MESSAGE_ID}/read")
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  echo ""
fi

# 3. マッチングAPIのテスト
echo "3. マッチングAPIのテスト"
echo "---------------------------"

echo "3-1. マッチングを作成"
RESPONSE=$(curl -s -X POST "${BASE_URL}/matches" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentAddress\": \"${WALLET_STUDENT}\",
    \"orgAddress\": \"${WALLET_ORG}\"
  }")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
MATCH_ID=$(echo "$RESPONSE" | jq -r '.match.matchId' 2>/dev/null)
echo ""

echo "3-2. 学生のマッチング一覧を取得"
RESPONSE=$(curl -s "${BASE_URL}/matches/student?walletAddress=${WALLET_STUDENT}")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

echo "3-3. 企業のマッチング一覧を取得"
RESPONSE=$(curl -s "${BASE_URL}/matches/org?walletAddress=${WALLET_ORG}")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

if [ -n "$MATCH_ID" ] && [ "$MATCH_ID" != "null" ]; then
  echo "3-4. マッチング詳細を取得"
  RESPONSE=$(curl -s "${BASE_URL}/matches/${MATCH_ID}")
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  echo ""
fi

echo "=== テスト完了 ==="

