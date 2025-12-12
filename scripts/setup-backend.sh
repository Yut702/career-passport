#!/bin/bash

# バックエンドのセットアップスクリプト
# DynamoDB Localの起動とテーブル作成を行う

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

echo "=== バックエンドセットアップ開始 ==="
echo ""

# バックエンドディレクトリに移動
cd backend

# 1. 依存関係のインストール（必要に応じて）
if [ ! -d "node_modules" ]; then
  echo "1. 依存関係をインストール中..."
  npm install
  echo ""
fi

# 2. DynamoDB Local の起動
echo "2. DynamoDB Local を起動中..."
npm run dynamodb:up

# 3. DynamoDB Local の起動を待つ
echo ""
echo "3. DynamoDB Local の起動を待機中..."
sleep 5

# 4. テーブルの作成
echo ""
echo "4. DynamoDB テーブルを作成中..."
npm run create-api-tables

echo ""
echo "=== バックエンドセットアップ完了 ==="
echo ""
echo "次のステップ:"
echo "1. DynamoDB Local が起動しました (http://localhost:8000)"
echo "2. 以下のテーブルが作成されました:"
echo "   - NonFungibleCareerEvents (イベントデータ)"
echo "   - NonFungibleCareerEventApplications (イベント応募データ)"
echo "   - NonFungibleCareerMessages (メッセージデータ)"
echo "   - NonFungibleCareerMatches (マッチングデータ)"
echo "3. バックエンドサーバーを起動: cd backend && npm run dev"

