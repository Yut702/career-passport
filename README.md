# Career Passport

## 東京大学 ブロックチェーンイノベーション寄附講座

### MOF グループリポジトリ

---

## 📋 プロジェクト概要

CareerPassport は、学生が企業からスタンプを集めて NFT 証明書を取得できるブロックチェーンアプリケーションです。

**主な機能**:

- 🎫 スタンプコレクション（企業からスタンプを取得）
- 🏆 NFT 証明書の取得（スタンプ 3 つで交換可能）
- 🔐 ゼロ知識証明（プライバシーを保護しながら証明）
- 📊 企業向けダッシュボード（スタンプ発行・統計管理）

---

## ✅ 現在の進捗

### 完了した作業

**UI 実装（Day 1-2）**:

- ✅ **入り口画面** - 学生/企業の選択画面
- ✅ **学生向け UI** - ホーム、マイページ、NFT 一覧、NFT 詳細、ゼロ知識証明
- ✅ **企業向け UI** - ダッシュボード、スタンプ発行
- ✅ **デザイン** - グラデーション、カードベース、アニメーション
- ✅ **ローカルストレージ** - モックデータでの動作確認

**実装済みページ**:

- `/` - 入り口（学生/企業選択）
- `/student` - 学生ホーム
- `/student/mypage` - マイページ（スタンプコレクション）
- `/student/nfts` - NFT 証明書一覧
- `/student/nft/:id` - NFT 詳細
- `/student/zk-proof` - ゼロ知識証明
- `/org` - 企業ダッシュボード
- `/org/stamp-issuance` - スタンプ発行

**技術スタック**:

- React 19 + Vite
- Tailwind CSS
- React Router
- Ethers.js（準備済み）

---

## 🚀 クイックスタート

### 1. フロントエンドの起動

```bash
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く

### 2. バックエンドの起動

```bash
# DynamoDB Local を Docker で起動
docker run -d \
  --name dynamodb \
  -p 8000:8000 \
  -v $(pwd)/dynamodb/data:/home/dynamodblocal/data \
  amazon/dynamodb-local

# バックエンドサーバーの起動
cd backend
npm install
npm run dev
```

### 3. 動作確認

1. **入り口画面**で「学生」または「企業」を選択
2. **学生向け**: ユーザー登録・ログイン、スタンプコレクション、NFT 証明書、ゼロ知識証明を確認
3. **企業向け**: ダッシュボードからスタンプを発行
  -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data

---

## 📚 実装手順書

詳細な実装手順は以下のドキュメントを参照：

- **[実装手順書（詳細）](./IMPLEMENTATION_GUIDE_10DAYS_DETAILED.md)**: 10 日で実装する詳細な手順書
- **[設計書](./DESIGN.md)**: システムアーキテクチャ、データフロー、UI/UX 設計

---

## 📁 プロジェクト構成

```
career-passport/
├── frontend/              # フロントエンド（React + Vite）
│   ├── src/
│   │   ├── pages/         # ページコンポーネント
│   │   ├── components/    # 共通コンポーネント
│   │   ├── lib/           # ユーティリティ
│   │   └── data/          # モックデータ
│   └── package.json
├── contracts/             # スマートコントラクト（Foundry）
│   ├── src/
│   │   ├── CareerPassportNFT.sol
│   │   └── StampManager.sol
│   └── script/
│       ├── DeployNFT.s.sol
│       └── DeployStamp.s.sol
├── IMPLEMENTATION_GUIDE_10DAYS_DETAILED.md  # 詳細手順書
└── DESIGN.md                                # 設計書
```

---

## 🎯 次のステップ

### Phase 2: スマートコントラクト実装（Day 3-4）

- Foundry セットアップ
- コントラクトのテストとデプロイ
- ローカルネットワークでの動作確認

### Phase 3: ウォレット連携（Day 5-6）

- MetaMask 連携
- コントラクトとの接続
- UI とブロックチェーンの統合

### Phase 4: 機能完成（Day 7-10）

- スタンプ発行機能（ブロックチェーン経由）
- NFT 交換機能
- ゼロ知識証明の実装
- デモ準備

詳細は [実装手順書（詳細）](./IMPLEMENTATION_GUIDE_10DAYS_DETAILED.md) を参照してください。

---

## 📝 注意事項

- **現在の実装**: UI のみ完成（ローカルストレージ使用）
- **ブロックチェーン連携**: 未実装（Day 3-4 で実装予定）
- **データ管理**: ローカルストレージ（一時的）

---

**最終更新**: 2025 年 12 月 2 日
