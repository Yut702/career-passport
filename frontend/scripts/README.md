# ローカルストレージクリーンアップ方法

ローカルストレージのデータをクリーンにする方法を説明します。

## 方法 1: クリーンアップツール（推奨）

1. `frontend/scripts/clean-local-storage.html` をブラウザで開く
2. 「現在のストレージを確認」ボタンで内容を確認
3. 「すべて削除」ボタンをクリック

## 方法 2: ブラウザの開発者ツールを使用

### Chrome / Edge

1. 開発者ツールを開く（F12）
2. **Application** タブを開く
3. 左側のメニューから **Local Storage** > **http://localhost:5173** を選択
4. すべてのキーを選択して右クリック → **Delete** をクリック

### Firefox

1. 開発者ツールを開く（F12）
2. **Storage** タブを開く
3. 左側のメニューから **Local Storage** > **http://localhost:5173** を選択
4. すべてのキーを選択して右クリック → **Delete** をクリック

## 方法 3: ブラウザのコンソールで実行

### すべてのデータを削除

```javascript
localStorage.clear();
```

### アプリケーションデータのみ削除

```javascript
// まず、clean-local-storage.js を読み込む
const script = document.createElement("script");
script.src = "/scripts/clean-local-storage.js";
document.head.appendChild(script);

// その後、実行
clearAppData();
```

### 現在の内容を確認

```javascript
// clean-local-storage.js を読み込んだ後
viewLocalStorage();
```

## 方法 4: アプリケーション内から実行

ブラウザのコンソールで以下のコードを実行：

```javascript
// すべてのデータを削除
localStorage.clear();
location.reload();
```

## 削除されるデータ

- `nonfungiblecareer_stamps` - スタンプデータ
- `nonfungiblecareer_nfts` - NFT データ
- `nonfungiblecareer_user` - ユーザー情報
- `nonfungiblecareer_contract_version` - コントラクトバージョン情報

## 注意事項

⚠️ **警告**: ローカルストレージをクリアすると、以下のデータが失われます：

- 保存されたスタンプデータ（ブロックチェーン上のデータは保持されます）
- 保存された NFT データ（ブロックチェーン上のデータは保持されます）
- ユーザー設定

削除されたデータは復元できません。
