#!/bin/bash
# CareerPassport クイックスタートスクリプト
# 使い方: ./scripts/quickstart.sh

set -e

echo "========================================="
echo "CareerPassport Quick Start"
echo "========================================="

# 1. DynamoDB Local の起動
echo ""
echo "[1/5] Starting DynamoDB Local..."
if [ "$(docker ps --filter name=dynamodb-local --filter status=running --format '{{.Names}}')" = "dynamodb-local" ]; then
  echo "  ✓ dynamodb-local is already running"
else
  if [ "$(docker ps -a --filter name=dynamodb-local --format '{{.Names}}')" = "dynamodb-local" ]; then
    echo "  Starting existing container..."
    docker start dynamodb-local
  else
    echo "  Creating and starting dynamodb-local..."
    docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local
  fi
  echo "  ✓ dynamodb-local started"
fi
sleep 2

# 2. バックエンド依存関係インストール
echo ""
echo "[2/5] Installing backend dependencies..."
cd backend
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install --silent
else
  npm install --silent
fi
echo "  ✓ Backend dependencies installed"

# 3. テーブル作成とシード
echo ""
echo "[3/5] Creating tables and seeding data..."
npm run create-table
npm run seed
echo "  ✓ Tables created and seeded"

# 4. フロントエンド依存関係インストール
echo ""
echo "[4/5] Installing frontend dependencies..."
cd ../frontend
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install --silent
else
  npm install --silent
fi
echo "  ✓ Frontend dependencies installed"

# 5. 完了メッセージ
echo ""
echo "========================================="
echo "✓ Setup Complete!"
echo "========================================="
echo ""
echo "次のステップ:"
echo ""
echo "1. バックエンドを起動 (ターミナル1):"
echo "   cd backend && pnpm run start"
echo ""
echo "2. フロントエンドを起動 (ターミナル2):"
echo "   cd frontend && pnpm run dev"
echo ""
echo "3. ブラウザでアクセス:"
echo "   http://localhost:5173/org-login"
echo ""
echo "テストアカウント:"
echo "   Email: org@example.com"
echo "   Password: password123"
echo ""
