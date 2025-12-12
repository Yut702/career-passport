#!/bin/bash

# データベースとローカルストレージをクリーンにするスクリプト
# 
# 用途: 
#   - DynamoDBのすべてのデータを削除
#   - ローカルストレージのクリーンアップ方法を案内
#
# 実行方法: bash scripts/clean-all.sh

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

echo "=== データベースとローカルストレージクリーンアップ ==="
echo ""

# 1. DynamoDBのクリーンアップ（テーブル内のデータのみ削除）
echo "1. DynamoDBのクリーンアップ（テーブル内のデータのみ削除）"
echo "   注意: テーブル構造は保持されます"
echo "   backend/scripts/clean-database.js を実行します..."
echo ""

cd backend
if [ -f "scripts/clean-database.js" ]; then
    node scripts/clean-database.js
else
    echo "⚠️  clean-database.js が見つかりません"
fi

cd ..

echo ""
echo "=== ローカルストレージのクリーンアップ ==="
echo ""
echo "ローカルストレージをクリーンアップするには、以下のいずれかの方法を使用してください:"
echo ""
echo "【方法1】クリーンアップツール（推奨）"
echo "  1. frontend/scripts/clean-local-storage.html をブラウザで開く"
echo "  2. 「現在のストレージを確認」で内容を確認"
echo "  3. 「すべて削除」ボタンをクリック"
echo ""
echo "【方法2】ブラウザの開発者ツールを使用"
echo "  1. ブラウザの開発者ツールを開く（F12）"
echo "  2. Application タブ（Chrome）または Storage タブ（Firefox）を開く"
echo "  3. Local Storage > http://localhost:5173（またはアプリのURL）を選択"
echo "  4. すべてのキーを選択して削除ボタンをクリック"
echo ""
echo "【方法3】ブラウザのコンソールで実行"
echo "  1. 開発者ツールのConsoleタブを開く"
echo "  2. 以下のいずれかを実行:"
echo "     - すべて削除: localStorage.clear();"
echo "     - アプリデータのみ: clearAppData();"
echo "     - 内容確認: viewLocalStorage();"
echo ""
echo "  注意: clearAppData() と viewLocalStorage() を使用するには、"
echo "        frontend/scripts/clean-local-storage.js を読み込む必要があります"
echo ""

echo "=== クリーンアップ完了 ==="

