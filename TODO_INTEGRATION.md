# Web3認証統合 TODO

## 現在の状態
- ✅ バックエンドWeb3 API完成 (server-web3.js, port 3001)
- ✅ フロントエンドMetaMask接続UI完成 (WalletConnect.jsx, useWallet.js)
- ❌ フロントエンド/バックエンド統合未完了

## 実装が必要な項目

### 1. API通信クライアント作成
**ファイル**: `frontend/src/api/web3Auth.js`

```javascript
// 実装内容:
- getAuthMessage() - 認証メッセージ取得
- verifyWallet() - 署名検証とJWT取得
- getStamps() - スタンプ一覧取得
- getNFTs() - NFT一覧取得
- その他のWeb3 APIエンドポイント
```

### 2. useWallet.jsに認証ロジック追加
**ファイル**: `frontend/src/hooks/useWallet.js`

```javascript
// 追加機能:
- loginWithBackend(address, signer)
  1. バックエンドから認証メッセージ取得
  2. MetaMaskで署名生成
  3. バックエンドで署名検証してJWT取得
  4. JWTをlocalStorageに保存
- connectWallet内でloginWithBackend呼び出し
```

### 3. ページコンポーネントをAPI対応に修正
**対象ファイル**:
- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/MyNFTs.jsx`
- `frontend/src/pages/MyPage.jsx`
- その他データ表示ページ

```javascript
// 変更内容:
- モックデータ(storage.js)の代わりにAPI呼び出し
- useWalletからaccountとtokenを取得
- useEffectでAPI呼び出し
- エラーハンドリング追加
```

### 4. 認証状態管理とルート保護
**新規ファイル**: `frontend/src/components/ProtectedRoute.jsx`

```javascript
// 実装内容:
- ウォレット接続チェック
- JWT有効性チェック
- 未認証時はリダイレクト
```

### 5. 動作確認とテスト
```bash
# バックエンド起動
cd backend && node src/server-web3.js

# フロントエンド起動
cd frontend && npm run dev

# テストシナリオ:
1. MetaMask接続
2. 署名生成と認証
3. JWT取得
4. スタンプ/NFTデータ取得
5. ページ遷移と状態維持
```

## マージ計画

### Miyamoto-branch → main
```bash
# 統合実装完了後
git checkout main
git merge Miyamoto-branch
# コンフリクト解決（hiraのemail認証を削除）
git push origin main
```

## 参考: バックエンドAPI仕様

**ベースURL**: `http://localhost:3001/api`

### 認証
- `GET /auth/message` - 認証メッセージ取得
- `POST /auth/verify-wallet` - 署名検証とJWT取得
  - Body: `{walletAddress, signature, message}`
  - Response: `{ok: true, token: "jwt..."}`

### スタンプ
- `GET /stamps/:walletAddress` - スタンプ一覧取得 (要JWT)
- `POST /stamps/issue` - スタンプ発行 (要JWT)
- `GET /stamps/:walletAddress/:stampId/metadata` - メタデータ取得

### NFT
- `GET /nfts/:walletAddress` - NFT一覧取得 (要JWT)
- `POST /nfts/mint` - NFT発行 (要JWT)
- `GET /nfts/:walletAddress/:tokenId/metadata` - メタデータ取得

### イベント
- `GET /events` - イベント一覧取得
- `POST /events` - イベント作成 (要JWT)
- `POST /events/:eventId/participate` - イベント参加 (要JWT)

## 注意事項
- JWTは`Authorization: Bearer <token>`ヘッダーで送信
- DynamoDB Localが起動していること (port 8000)
- 環境変数(.env)が正しく設定されていること
