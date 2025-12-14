#!/bin/bash

# Anvilの状態をリセットするスクリプト
# このスクリプトを実行すると、Anvilの状態ファイルが削除され、次回起動時に新しい状態で開始されます

set -e

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

STATE_FILE="anvil-state.json"

echo "=== Anvil 状態リセット ==="
echo ""

# 状態ファイルが存在するか確認
if [ -f "$STATE_FILE" ]; then
  echo "⚠️  警告: 以下の状態ファイルを削除します:"
  echo "   $STATE_FILE"
  echo "   ファイルサイズ: $(du -h "$STATE_FILE" | cut -f1)"
  echo ""
  read -p "本当に削除しますか？ (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$STATE_FILE"
    echo "✅ 状態ファイルを削除しました。"
    echo ""
    echo "次回 Anvil を起動すると、新しい状態で開始されます。"
    echo "コントラクトを再デプロイする必要があります。"
  else
    echo "❌ キャンセルしました。"
    exit 0
  fi
else
  echo "ℹ️  状態ファイルが見つかりませんでした。"
  echo "   ($STATE_FILE)"
  echo ""
  echo "Anvilは既に新しい状態で動作しているか、まだ起動していません。"
fi

