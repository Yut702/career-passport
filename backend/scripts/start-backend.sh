#!/bin/bash

# バックエンドAPIサーバーを起動するスクリプト
# DynamoDB Localをリフレッシュして起動します

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

echo "=== バックエンド起動 ==="
echo ""

# 1. 既存のDynamoDB Localを停止してボリュームを削除（毎回リセット）
echo "1. DynamoDB Localをリフレッシュ中（データを削除）..."
# 既存のコンテナを停止してボリュームを削除
docker compose down -v 2>/dev/null || true
echo "   ✅ DynamoDB Localをリセットしました"
echo ""

# 2. DynamoDB Localを起動
echo "2. DynamoDB Localを起動中..."
npm run dynamodb:up

# 数秒待ってからテーブルを作成
echo ""
echo "3. 数秒待機中..."
sleep 5

# 3. テーブルを作成
echo ""
echo "4. DynamoDBテーブルを作成中..."
npm run create-api-tables
npm run create-companies-table

# 4. PoC用企業データを初期化
echo ""
echo "5. PoC用企業データを初期化中..."
npm run init-poc-companies

echo ""
echo "6. バックエンドAPIサーバーを起動中..."
echo "   停止するには Ctrl+C を押してください。"
echo ""

# 5. バックエンドAPIサーバーを起動
npm run dev

