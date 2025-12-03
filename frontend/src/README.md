# CareerPassport Frontend

企業/組織向けフロントエンド

## 前提条件

- Node.js v18以上
- pnpm（または npm）
- バックエンドサーバーが起動していること

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd frontend
pnpm install
```

### 2. 開発サーバー起動

```bash
pnpm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## ページ一覧

| パス | 説明 |
|------|------|
| `/org-login` | 組織ログイン/登録ページ |
| `/org-dashboard` | 組織ダッシュボード |

## 使い方

### 1. 組織ログイン

1. `http://localhost:5173/org-login` にアクセス
2. テストアカウントでログイン:
   - **Email**: `org@example.com`
   - **Password**: `password123`
3. ログイン成功後、自動的にダッシュボードへリダイレクト

### 2. ダッシュボード確認

ログイン後、`http://localhost:5173/org-dashboard` で以下が表示されます:

- **サマリーカード**: スタンプ総数、参加者数、NFT数
- **イベント一覧**: 各イベントの参加者数、スタンプ数、満足度

## 環境変数

`.env` ファイルで API ベース URL を設定可能:

```
VITE_API_BASE=http://localhost:3000
```

デフォルトは `http://localhost:3000` です。
