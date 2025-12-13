#!/bin/bash

# ZKP機能のセットアップスクリプト

set -e

echo "🚀 ZKP機能のセットアップを開始します..."

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# 1. ZKP回路の依存関係をインストール
echo ""
echo "📦 Step 1: ZKP回路の依存関係をインストール中..."
cd zkp
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "  依存関係は既にインストール済みです"
fi

# 2. 回路をコンパイル
echo ""
echo "🔨 Step 2: 回路をコンパイル中..."
npm run compile

# 3. 信頼設定を実行
echo ""
echo "🔐 Step 3: 信頼設定（Trusted Setup）を実行中..."
npm run setup

# 4. ビルド結果をフロントエンドに配置
echo ""
echo "📁 Step 4: ビルド結果をフロントエンドに配置中..."
cd "$PROJECT_ROOT"
mkdir -p frontend/public/zkp/build

# ファイルをコピー
if [ -f "zkp/build/age.wasm" ]; then
  cp zkp/build/age.wasm frontend/public/zkp/build/ 2>/dev/null || true
  echo "  ✅ age.wasm をコピーしました"
fi
if [ -f "zkp/build/age.zkey" ]; then
  cp zkp/build/age.zkey frontend/public/zkp/build/ 2>/dev/null || true
  echo "  ✅ age.zkey をコピーしました"
fi
if [ -f "zkp/build/age.vkey.json" ]; then
  cp zkp/build/age.vkey.json frontend/public/zkp/build/ 2>/dev/null || true
  echo "  ✅ age.vkey.json をコピーしました"
fi

if [ -f "zkp/build/toeic.wasm" ]; then
  cp zkp/build/toeic.wasm frontend/public/zkp/build/ 2>/dev/null || true
  echo "  ✅ toeic.wasm をコピーしました"
fi
if [ -f "zkp/build/toeic.zkey" ]; then
  cp zkp/build/toeic.zkey frontend/public/zkp/build/ 2>/dev/null || true
  echo "  ✅ toeic.zkey をコピーしました"
fi
if [ -f "zkp/build/toeic.vkey.json" ]; then
  cp zkp/build/toeic.vkey.json frontend/public/zkp/build/ 2>/dev/null || true
  echo "  ✅ toeic.vkey.json をコピーしました"
fi

if [ -f "zkp/build/degree.wasm" ]; then
  cp zkp/build/degree.wasm frontend/public/zkp/build/ 2>/dev/null || true
  echo "  ✅ degree.wasm をコピーしました"
fi
if [ -f "zkp/build/degree.zkey" ]; then
  cp zkp/build/degree.zkey frontend/public/zkp/build/ 2>/dev/null || true
  echo "  ✅ degree.zkey をコピーしました"
fi
if [ -f "zkp/build/degree.vkey.json" ]; then
  cp zkp/build/degree.vkey.json frontend/public/zkp/build/ 2>/dev/null || true
  echo "  ✅ degree.vkey.json をコピーしました"
fi

# 5. フロントエンドの依存関係をインストール
echo ""
echo "📦 Step 5: フロントエンドの依存関係をインストール中..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "  依存関係は既にインストール済みです"
fi

echo ""
echo "✨ セットアップが完了しました！"
echo ""
echo "次のステップ:"
echo "  1. cd frontend"
echo "  2. npm run dev"
echo "  3. ブラウザで http://localhost:5173 にアクセス"
echo "  4. VC管理とゼロ知識証明ページでZKP機能を試してください"

