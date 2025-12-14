#!/bin/bash

# すべての状態をリセットするスクリプト
# Anvil、DynamoDB Local、ローカルストレージのクリーンアップ方法を案内

set -e

echo "=== 全状態リセットスクリプト ==="
echo ""
echo "このスクリプトは、以下の状態をリセットします："
echo "1. Anvilの状態ファイル（anvil-state.json）"
echo "2. DynamoDB Localのデータ（Dockerボリューム）"
echo "3. ローカルストレージ（ブラウザ側で手動実行が必要）"
echo ""

# スクリプトのディレクトリに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Anvilの状態ファイルを削除
echo "1. Anvilの状態ファイルをリセット中..."
if [ -f "contracts/anvil-state.json" ]; then
  rm "contracts/anvil-state.json"
  echo "   ✅ Anvilの状態ファイルを削除しました"
else
  echo "   ℹ️  Anvilの状態ファイルは存在しませんでした"
fi

# 2. DynamoDB Localのデータをリセット
echo ""
echo "2. DynamoDB Localのデータをリセット中..."
if [ -d "backend" ]; then
  cd backend
  if docker compose ps | grep -q dynamodb; then
    echo "   DynamoDB Localを停止中..."
    docker compose down -v
    echo "   ✅ DynamoDB Localのデータを削除しました"
  else
    echo "   ℹ️  DynamoDB Localは起動していませんでした"
    # 念のため、ボリュームを削除
    docker compose down -v 2>/dev/null || true
  fi
  cd ..
else
  echo "   ⚠️  backendディレクトリが見つかりません"
fi

# 3. ローカルストレージのクリーンアップ方法を案内
echo ""
echo "3. ローカルストレージのクリーンアップ"
echo "   ブラウザのローカルストレージは、以下のいずれかの方法でクリアしてください："
echo ""
echo "   方法1: ブラウザの開発者ツールを使用"
echo "   - Chrome/Edge: F12 → Application → Local Storage → http://localhost:5173 → すべて削除"
echo "   - Firefox: F12 → Storage → Local Storage → http://localhost:5173 → すべて削除"
echo ""
echo "   方法2: ブラウザのコンソールで実行"
echo "   localStorage.clear();"
echo "   location.reload();"
echo ""
echo "   方法3: クリーンアップツールを使用"
echo "   frontend/scripts/clean-local-storage.html をブラウザで開く"
echo ""

echo "=== リセット完了 ==="
echo ""
echo "次のステップ:"
echo "1. Anvilを起動: cd contracts && bash scripts/start-anvil.sh"
echo "2. コントラクトをデプロイ: cd contracts && bash scripts/deploy-all.sh"
echo "3. DynamoDB Localを起動: cd backend && npm run dynamodb:up"
echo "4. テーブルを作成: cd backend && npm run create-api-tables"
echo "5. ブラウザのローカルストレージをクリア（上記の方法を参照）"
echo "6. フロントエンドを起動: cd frontend && npm run dev"
echo ""

