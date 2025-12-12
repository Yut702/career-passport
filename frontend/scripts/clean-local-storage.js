/**
 * ローカルストレージクリーンアップ用のJavaScriptコード
 *
 * ブラウザのコンソールで実行するか、ブックマークレットとして使用できます。
 */

// 方法1: すべてのローカルストレージをクリア
function clearAllLocalStorage() {
  const keys = Object.keys(localStorage);
  const count = keys.length;

  if (count === 0) {
    console.log("✅ ローカルストレージは既に空です");
    return;
  }

  if (
    confirm(
      `本当に ${count}件のデータを削除しますか？\nこの操作は取り消せません。`
    )
  ) {
    localStorage.clear();
    console.log(`✅ ${count}件のデータを削除しました`);
    alert(`✅ ${count}件のデータを削除しました`);
  } else {
    console.log("❌ クリーンアップをキャンセルしました");
  }
}

// 方法2: アプリケーション固有のデータのみクリア
function clearAppData() {
  const appKeys = [
    "nonfungiblecareer_stamps",
    "nonfungiblecareer_nfts",
    "nonfungiblecareer_user",
    "nonfungiblecareer_contract_version",
  ];

  let deletedCount = 0;
  appKeys.forEach((key) => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      deletedCount++;
    }
  });

  console.log(`✅ ${deletedCount}件のアプリケーションデータを削除しました`);
  alert(`✅ ${deletedCount}件のアプリケーションデータを削除しました`);
}

// 方法3: 現在のストレージ内容を表示
function viewLocalStorage() {
  const keys = Object.keys(localStorage);

  if (keys.length === 0) {
    console.log("ローカルストレージは空です");
    return;
  }

  console.log(`📋 ローカルストレージ内容 (${keys.length}件):`);
  keys.forEach((key) => {
    const value = localStorage.getItem(key);
    const preview =
      value.length > 100 ? value.substring(0, 100) + "..." : value;
    console.log(`  - ${key}: ${preview}`);
  });
}

// 実行方法の説明を表示
console.log(`
=== ローカルストレージクリーンアップ方法 ===

方法1: すべてのデータを削除
  clearAllLocalStorage()

方法2: アプリケーションデータのみ削除
  clearAppData()

方法3: 現在の内容を確認
  viewLocalStorage()

方法4: 直接実行（確認なし）
  localStorage.clear()
`);

// グローバルに公開
window.clearAllLocalStorage = clearAllLocalStorage;
window.clearAppData = clearAppData;
window.viewLocalStorage = viewLocalStorage;
