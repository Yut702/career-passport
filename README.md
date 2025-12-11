# Non-Fungible Career

## 東京大学 ブロックチェーンイノベーション寄附講座

### MOF グループリポジトリ

---

## 📋 目次

1. [環境設定](#環境設定)
2. [進捗・ステータス](#進捗ステータス)
3. [設計概要](#設計概要)
4. [詳細仕様手順](#詳細仕様手順)

---

## 環境設定

### 前提条件

- Node.js 18 以上
- npm または pnpm
- Git
- MetaMask（ブラウザ拡張機能）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd career-passport
```

### 2. Foundry のインストール

```bash
# Foundry のインストールスクリプトをダウンロードして実行
curl -L https://foundry.paradigm.xyz | bash

# foundryup を実行（初回のみ）
foundryup
```

インストール後、ターミナルを再起動するか、以下のコマンドでパスを更新します：

```bash
source ~/.bashrc  # または source ~/.zshrc
```

**確認**:

```bash
forge --version
cast --version
anvil --version
```

### 3. コントラクトのセットアップ

```bash
# contracts ディレクトリに移動
cd contracts

# OpenZeppelin Contracts のインストール（既にインストール済みの場合はスキップ）
forge install OpenZeppelin/openzeppelin-contracts

# コントラクトのコンパイル
forge build
```

### 4. ローカルネットワーク（Anvil）の起動とデプロイ

**ターミナル 1**: Anvil を起動

```bash
cd contracts
anvil
```

**ターミナル 2**: コントラクトをデプロイ

```bash
cd contracts
bash scripts/deploy-all.sh
```

このスクリプトは以下を実行します：

1. `NonFungibleCareerNFT`をデプロイ
2. `StampManager`をデプロイ
3. デプロイ済みアドレスを`deployed.json`に自動保存
4. 環境変数ファイル（`frontend/.env.local`）を自動生成

### 5. MetaMask の設定

1. MetaMask をインストール
2. ローカルネットワーク（Anvil）を追加：
   - ネットワーク名: `Anvil Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - 通貨記号: `ETH`
3. （オプション）Anvil のテストアカウントをインポート

### 6. フロントエンドのセットアップ

**ターミナル 3**: フロントエンドを起動

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開いて動作確認してください。

### トラブルシューティング

**Foundry がインストールされない場合**:

```bash
foundryup
```

**コントラクトのコンパイルエラー**:

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --force
forge build
```

**Anvil に接続できない場合**:

```bash
# Anvilが起動しているか確認
curl http://localhost:8545
```

詳細は [Day 4 テストとデプロイガイド](./DAY4_TEST_AND_DEPLOY_GUIDE.md) の「トラブルシューティング」セクションを参照

---

## 進捗・ステータス

### 全体スケジュール

```
Day 1-2:  UI実装（モックデータ）          ✅ 完了
Day 3-4:  スマートコントラクト実装         ✅ 完了
Day 5:    MetaMask 連携                   ✅ 完了
Day 6:    UI とブロックチェーンの統合      ✅ 完了
Day 7-8:  バックエンド API 実装           📋 予定
Day 9-10: 機能完成とテスト                📋 予定
```

### 実装完了率

- **フロントエンド UI**: 100% ✅
- **スマートコントラクト**: 100% ✅
- **ブロックチェーン連携**: 100% ✅
- **ウォレット連携**: 100% ✅
- **バックエンド API**: 0% 📋
- **ZKP 実装**: 10% 📋（モックのみ）

**全体進捗**: 約 75% 完了

### 完了した機能

#### Day 1-2: UI 実装 ✅

- ✅ 全ページの UI 実装完了（個人ユーザー向け 11 ページ、企業ユーザー向け 11 ページ）
- ✅ WalletConnect 統合（MetaMask 認証）
- ✅ ローカルストレージでのデータ管理

#### Day 3-4: スマートコントラクト実装 ✅

- ✅ `NonFungibleCareerNFT.sol` - NFT 証明書発行コントラクト
- ✅ `StampManager.sol` - スタンプ管理コントラクト
- ✅ ユニットテスト実装完了
- ✅ ローカルネットワークへのデプロイ完了
- ✅ デプロイスクリプトとテストスクリプトの作成

#### Day 5: MetaMask 連携 ✅

- ✅ ウォレット接続機能
- ✅ ネットワーク設定
- ✅ スタンプ発行機能（ブロックチェーン経由）
- ✅ NFT 発行機能（ブロックチェーン経由）
- ✅ エラーハンドリングとトランザクション状態管理

#### Day 6: UI とブロックチェーンの統合 ✅

- ✅ 全ページのブロックチェーン連携
  - `Home.jsx` - ユーザーダッシュボード
  - `MyNFTs.jsx` - NFT 一覧
  - `OrgDashboard.jsx` - 企業ダッシュボード
  - `NFTDetail.jsx` - NFT 詳細
- ✅ ローカルストレージとブロックチェーンの同期
- ✅ エラーハンドリングの強化
- ✅ ローディング状態の表示改善
- ✅ トランザクション状態の可視化

### 今後の予定

#### Day 7-8: バックエンド API 実装 📋

- データベース設計（DynamoDB）
- イベント応募 API
- メッセージ API
- マッチング API

#### Day 9-10: 機能完成とテスト 📋

- ゼロ知識証明の実装（本格版）
- 統合テスト
- UI/UX 改善
- デモ準備

---

## 設計概要

### プロジェクト概要

**Non-Fungible Career** は、ブロックチェーン技術を活用したキャリア証明書プラットフォームです。

**主な機能**:

- 🎫 スタンプコレクション（企業からスタンプを取得）
- 🏆 NFT 証明書の取得（スタンプ 3 つで交換可能）
- 🔐 ゼロ知識証明（プライバシーを保護しながら証明）
- 📊 企業向けダッシュボード（スタンプ発行・統計管理）

### システムアーキテクチャ

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│                                         │
│  ┌──────────┐  ┌──────────┐          │
│  │  Student │  │Organization│         │
│  │    UI    │  │    UI     │          │
│  └──────────┘  └──────────┘          │
│         │              │                │
│         └──────┬───────┘                │
│                │                        │
│         ┌─────▼─────┐                  │
│         │  Wallet   │                  │
│         │  Connect  │                  │
│         └─────┬─────┘                  │
└───────────────┼────────────────────────┘
                │
                │ (MetaMask)
                │
┌───────────────▼────────────────────────┐
│    Local Blockchain (Anvil)            │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │  NFT Contract│  │Stamp Manager │   │
│  │  (ERC721)    │  │  Contract    │   │
│  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────┘
```

### 主要機能フロー

#### スタンプ獲得から NFT 証明書取得まで

1. ユーザーがウォレット接続でログイン
2. 企業がスタンプを発行（ブロックチェーン上に記録）
3. スタンプを 3 つ集めると NFT 証明書に交換可能
4. NFT 証明書を取得（ブロックチェーン上に記録）

#### 仕事探しからマッチングまで

1. 仕事応募条件を設定
2. 条件に合った仕事を検索
3. ZKP で条件を満たすことを証明（VC から選択的に開示）
4. メッセージ交換時に VC から必要最小限の情報のみを選択的に開示
5. マッチング成立

### 技術スタック

**フロントエンド**:

- React 19 + Vite
- Tailwind CSS
- React Router
- Ethers.js v6

**ブロックチェーン**:

- Foundry
- Solidity 0.8.20
- Anvil（ローカルブロックチェーン）
- OpenZeppelin

**開発ツール**:

- MetaMask
- Git

詳細な設計情報は [プロジェクト概要書](./PROJECT_OVERVIEW.md) を参照してください。

---

## 詳細仕様手順

### 📖 主要ドキュメント

- **[プロジェクト概要書](./PROJECT_OVERVIEW.md)**: プロジェクト全体の概要、アーキテクチャ、設計

### 📋 詳細手順書（Day 別）

- **[Day 3 セットアップガイド](./DAY3_FOUNDRY_SETUP_GUIDE.md)**: Foundry セットアップとコントラクト実装
- **[Day 4 テストとデプロイガイド](./DAY4_TEST_AND_DEPLOY_GUIDE.md)**: テストとデプロイ手順
- **[Day 5 MetaMask 連携ガイド](./DAY5_WALLET_INTEGRATION_GUIDE.md)**: ウォレット連携実装
- **[Day 6 ブロックチェーン統合ガイド](./DAY6_BLOCKCHAIN_INTEGRATION_GUIDE.md)**: UI とブロックチェーンの統合

---

**最終更新**: 2025 年 12 月 11 日（Day 6 完了）
