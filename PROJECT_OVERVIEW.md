# Non-Fungible Career プロジェクト概要書

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [システムアーキテクチャ](#システムアーキテクチャ)
3. [実装進捗](#実装進捗)
4. [主要機能](#主要機能)
5. [UI/UX 設計](#uiux-設計)
6. [スマートコントラクト設計](#スマートコントラクト設計)
7. [技術スタック](#技術スタック)
8. [ディレクトリ構造](#ディレクトリ構造)
9. [次のステップ](#次のステップ)

---

## プロジェクト概要

**Non-Fungible Career** は、ブロックチェーン技術を活用したキャリア証明書プラットフォームです。

### コンセプト

- 🎫 **スタンプシステム**: 企業が発行するスタンプを集める
- 🏆 **NFT 証明書**: スタンプを集めると NFT 証明書を取得
- 🔐 **Web3 認証**: MetaMask によるウォレット接続認証
- 📊 **ダッシュボード**: ユーザーと企業向けの管理画面

### 主な特徴

- **非中央集権**: ブロックチェーン上でデータを管理
- **プライバシー保護**: 個人情報を表示しない Web3 設計
- **透明性**: すべてのトランザクションがブロックチェーン上で記録
- **検証可能性**: NFT 証明書の真正性をブロックチェーン上で検証可能

---

## システムアーキテクチャ

### 全体構成

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

### コンポーネント構成

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home.jsx              # ホーム画面
│   │   ├── MyPage.jsx            # マイページ（スタンプ一覧）
│   │   ├── MyNFTs.jsx            # NFT 一覧
│   │   ├── NFTDetail.jsx         # NFT 詳細
│   │   ├── OrgDashboard.jsx      # 企業ダッシュボード
│   │   └── OrgStampIssuance.jsx  # スタンプ発行
│   ├── components/
│   │   ├── Layout.jsx           # レイアウト
│   │   ├── Navigation.jsx        # ナビゲーション
│   │   ├── WalletConnect.jsx     # ウォレット接続
│   │   ├── StampCard.jsx         # スタンプカード
│   │   ├── NFTCard.jsx           # NFT カード
│   │   └── ProgressBar.jsx      # 進捗バー
│   ├── hooks/
│   │   ├── useWallet.js          # ウォレットフック
│   │   ├── useContracts.js       # コントラクトフック
│   │   └── useSync.js            # 同期フック
│   ├── lib/
│   │   ├── contracts.js          # コントラクト接続
│   │   ├── storage.js            # ローカルストレージ
│   │   ├── network.js            # ネットワーク設定
│   │   ├── transactions.js       # トランザクション管理
│   │   └── sync.js               # 同期ユーティリティ
│   ├── data/
│   │   └── mockData.js           # モックデータ
│   └── router.jsx                # ルーティング
```

### データフロー

#### スタンプ発行フロー

```
企業ユーザー
    │
    ├─> スタンプ発行画面
    │       │
    │       ├─> スタンプ情報入力
    │       │   (名前、企業名、カテゴリ)
    │       │
    │       └─> ウォレット接続確認
    │               │
    │               ├─> MetaMask でトランザクション承認
    │               │
    │               └─> StampManager コントラクト呼び出し
    │                       │
    │                       └─> ブロックチェーンに記録
    │                               │
    │                               └─> イベント発火
    │                                       │
    │                                       └─> UI 更新
```

#### NFT 交換フロー

```
ユーザー
    │
    ├─> マイページ
    │       │
    │       ├─> スタンプ一覧表示
    │       │   (企業別に集計)
    │       │
    │       └─> NFT 交換可能判定
    │               │
    │               ├─> 同じ企業のスタンプ 3 つ以上？
    │               │       │
    │               │       ├─> YES → 交換ボタン表示
    │               │       │
    │               │       └─> NO → 進捗バー表示
    │               │
    │               └─> 交換ボタンクリック
    │                       │
    │                       ├─> MetaMask でトランザクション承認
    │                       │
    │                       └─> NFT コントラクト呼び出し
    │                               │
    │                               ├─> NFT 発行
    │                               │
    │                               └─> UI 更新
```

#### データ読み込みフロー

```
フロントエンド → ブロックチェーン → ローカルストレージ（キャッシュ）
```

---

## 実装進捗

### ✅ 完了したフェーズ

#### Day 1-2: UI 実装（モックデータ）✅

- ✅ 全ページの UI 実装完了
- ✅ WalletConnect 統合（MetaMask 認証）
- ✅ ローカルストレージでのデータ管理

#### Day 3-4: スマートコントラクト実装 ✅

- ✅ Foundry セットアップ
- ✅ NonFungibleCareerNFT コントラクト実装
- ✅ StampManager コントラクト実装
- ✅ テストとデプロイ

#### Day 5: MetaMask 連携 ✅

- ✅ ウォレット接続機能
- ✅ ネットワーク設定
- ✅ スタンプ発行機能（ブロックチェーン経由）
- ✅ NFT 発行機能（ブロックチェーン経由）

#### Day 6: UI とブロックチェーンの統合 ✅

- ✅ 全ページのブロックチェーン連携
- ✅ ローカルストレージとブロックチェーンの同期
- ✅ エラーハンドリングの強化
- ✅ ローディング状態の表示改善
- ✅ トランザクション状態の可視化

### 📋 今後の予定

#### Day 7-8: 機能完成とテスト

- バックエンド API 実装
- イベント応募機能
- メッセージ機能
- マッチング機能
- 統合テスト

#### Day 9-10: デモ準備と最終調整

- デモ用データ準備
- UI/UX 改善
- プレゼン資料作成

---

## 主要機能

### ユーザー向け機能

1. **ダッシュボード**

   - スタンプ数の表示
   - NFT 証明書数の表示
   - 次の目標の表示

2. **マイページ**

   - スタンプコレクションの表示
   - 企業別のスタンプ数統計

3. **NFT 証明書**

   - NFT 一覧の表示
   - NFT 詳細の表示
   - レアリティの表示

4. **イベント**
   - イベント一覧の表示
   - イベントへの応募

### 企業向け機能

1. **ダッシュボード**

   - 発行済みスタンプ数の表示
   - 参加者数の表示
   - NFT 発行数の表示

2. **スタンプ発行**

   - ユーザーへのスタンプ発行（ブロックチェーン経由）
   - スタンプ情報の設定

3. **統計管理**
   - スタンプ発行履歴の表示
   - 参加者統計の表示

---

## UI/UX 設計

### 主要画面

#### 1. ホーム画面 (`/student`)

- スタンプ数の表示
- NFT 証明書数の表示
- 次の目標の表示（企業別スタンプ進捗）
- 最近のスタンプ一覧

#### 2. マイページ (`/student/mypage`)

- スタンプコレクションの表示（企業別）
- 企業別のスタンプ数統計
- NFT 証明書一覧

#### 3. NFT 詳細画面 (`/student/nft/:id`)

- NFT の詳細情報
- レアリティの表示
- 取得条件の表示
- ブロックチェーン情報

#### 4. 企業ダッシュボード (`/org`)

- 発行済みスタンプ数の表示
- 参加者数の表示
- NFT 発行数の表示
- 最近の発行履歴

## スマートコントラクト設計

### NonFungibleCareerNFT.sol

**機能**:

- ERC721 準拠の NFT 発行
- 譲渡不可機能
- メタデータ管理（名前、レアリティ、企業情報）

**主要関数**:

```solidity
function mint(
    address to,
    string memory tokenURI,
    string memory name,
    string memory rarity,
    string[] memory organizations
) public onlyOwner returns (uint256)

function getTokenName(uint256 tokenId) public view returns (string memory)
function getTokenRarity(uint256 tokenId) public view returns (string memory)
function getTokenOrganizations(uint256 tokenId) public view returns (string[] memory)
function getTotalSupply() public view returns (uint256)
```

### StampManager.sol

**機能**:

- スタンプ発行
- スタンプ集計（企業別、カテゴリ別）
- NFT 交換条件判定

**主要関数**:

```solidity
function issueStamp(
    address user,
    string memory name,
    string memory organization,
    string memory category
) public onlyOwner

function getUserStamps(address user) public view returns (Stamp[] memory)
function canMintNFT(
    address user,
    string memory organization
) public view returns (bool)
```

## 技術スタック

### フロントエンド

- **React 19** - UI フレームワーク
- **Vite** - ビルドツール
- **React Router** - ルーティング
- **Tailwind CSS** - スタイリング
- **Ethers.js v6** - ブロックチェーン連携
- **LocalStorage** - データキャッシュ

### ブロックチェーン

- **Foundry** - 開発環境
- **Solidity 0.8.20** - スマートコントラクト言語
- **Anvil** - ローカルブロックチェーン
- **OpenZeppelin** - セキュリティライブラリ

### 開発ツール

- **MetaMask** - ウォレット
- **Git** - バージョン管理

---

## ディレクトリ構造

```
career-passport/
├── frontend/              # フロントエンドアプリケーション
│   ├── src/
│   │   ├── pages/         # ページコンポーネント
│   │   ├── components/    # 共通コンポーネント
│   │   ├── hooks/         # カスタムフック
│   │   ├── lib/           # ユーティリティ
│   │   └── abis/          # コントラクト ABI
│   └── package.json
│
├── contracts/             # スマートコントラクト
│   ├── src/               # コントラクトソース
│   ├── test/              # テスト
│   ├── script/            # デプロイスクリプト
│   └── scripts/           # シェルスクリプト
│
├── backend/               # バックエンド API（予定）
│   └── src/
│
├── README.md              # プロジェクトの概要と進捗
├── PROJECT_OVERVIEW.md    # プロジェクト全体の概要と設計（このファイル）
│
└── DAY3-6_*.md           # Day 別の詳細手順書
```

---

## 次のステップ

### すぐに始められること

1. **README を読む**: プロジェクトの概要と進捗を確認
2. **実装手順書を読む**: Day 1-6 の実装手順を確認
3. **環境をセットアップ**: Foundry と Node.js のセットアップ
4. **コントラクトをデプロイ**: ローカルネットワークへのデプロイ
5. **フロントエンドを起動**: 開発サーバーの起動

### 開発の流れ

1. **コントラクトの開発**: `contracts/` ディレクトリで作業
2. **フロントエンドの開発**: `frontend/` ディレクトリで作業
3. **統合テスト**: フロントエンドとブロックチェーンの連携確認

---

## 📚 参考ドキュメント

### 主要ドキュメント

- **[README](./README.md)**: プロジェクトの概要と進捗状況
- **[プロジェクト概要書](./PROJECT_OVERVIEW.md)**: プロジェクト全体の概要、アーキテクチャ、設計（このファイル）

### 詳細手順書（Day 別）

- **[Day 3 セットアップガイド](./DAY3_FOUNDRY_SETUP_GUIDE.md)**: Foundry セットアップとコントラクト実装
- **[Day 4 テストとデプロイガイド](./DAY4_TEST_AND_DEPLOY_GUIDE.md)**: テストとデプロイ手順
- **[Day 5 MetaMask 連携ガイド](./DAY5_WALLET_INTEGRATION_GUIDE.md)**: ウォレット連携実装
- **[Day 6 ブロックチェーン統合ガイド](./DAY6_BLOCKCHAIN_INTEGRATION_GUIDE.md)**: UI とブロックチェーンの統合

---

**最終更新**: 2025 年 12 月 11 日（Day 6 完了時点）
