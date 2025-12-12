# Non-Fungible Career

## 東京大学 ブロックチェーンイノベーション寄附講座

### MOF グループリポジトリ

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [進捗・ステータス](#進捗ステータス)
3. [初回セットアップ手順](#初回セットアップ手順)
4. [日常的なスタートアップ手順](#日常的なスタートアップ手順)
5. [アプリケーション仕様](#アプリケーション仕様)
6. [UI 遷移図](#ui遷移図)
7. [ブロックチェーン設計](#ブロックチェーン設計)
8. [データベース設計](#データベース設計)
9. [システムアーキテクチャ](#システムアーキテクチャ)
10. [詳細手順書](#詳細手順書)

---

## プロジェクト概要

**Non-Fungible Career** は、ブロックチェーン技術を活用したキャリア証明書プラットフォームです。学生と企業を結びつけ、透明性とプライバシーを両立した人材マッチングを実現します。

### 主な機能

- 🎫 **スタンプシステム**: 企業が学生にスタンプを発行（ブロックチェーン上に記録）
- 🏆 **NFT 証明書**: 同じ企業からスタンプを 3 つ集めると NFT 証明書を取得可能
- 🔐 **ゼロ知識証明（ZKP）**: プライバシーを保護しながら条件を満たすことを証明
- 📅 **イベント応募**: NFT 獲得イベントへの応募機能
- 💬 **メッセージ機能**: 学生と企業間のメッセージ交換
- 🤝 **マッチング機能**: 条件に合った学生と企業のマッチング
- 📊 **企業ダッシュボード**: スタンプ発行・統計管理

---

## 進捗・ステータス

### ✅ プロジェクト完了

**全体進捗**: **100% 完了** 🎉

```
Day 1-2:  UI実装（モックデータ）          ✅ 完了
Day 3-4:  スマートコントラクト実装         ✅ 完了
Day 5:    MetaMask 連携                   ✅ 完了
Day 6:    UI とブロックチェーンの統合      ✅ 完了
Day 7:    バックエンド API 実装           ✅ 完了
Day 8:    テストとアプリ完成度向上        ✅ 完了
```

### 実装完了率

- **フロントエンド UI**: 100% ✅
- **スマートコントラクト**: 100% ✅
- **ブロックチェーン連携**: 100% ✅
- **ウォレット連携**: 100% ✅
- **バックエンド API**: 100% ✅
  - イベント応募 API ✅
  - メッセージ API ✅
  - マッチング API ✅
  - イベント管理 API ✅
  - DynamoDB 統合 ✅
- **データベース設計**: 100% ✅
- **リファクタリング**: 100% ✅

### 完了した機能

#### ✅ 学生向け機能

- ウォレット接続
- スタンプコレクション表示
- NFT 証明書一覧・詳細
- イベント一覧・応募
- 応募履歴確認
- 求人条件設定・検索
- マッチング企業一覧
- メッセージ機能
- VC 管理・ZKP 生成

#### ✅ 企業向け機能

- ウォレット接続
- スタンプ発行
- NFT 証明書発行
- イベント作成・管理
- 応募確認・承認/拒否
- 人材募集条件設定
- 候補者検索
- マッチング候補者一覧
- メッセージ機能

---

## 初回セットアップ手順

この手順に従うことで、Git プル後からアプリが正常に動作するまでを一通り実行できます。

### 前提条件

以下のソフトウェアがインストールされていることを確認してください：

- **Node.js 18 以上** - [公式サイト](https://nodejs.org/)からインストール
- **npm** - Node.js に含まれています
- **Docker Desktop** - [公式サイト](https://www.docker.com/products/docker-desktop/)からインストール
- **Git** - [公式サイト](https://git-scm.com/)からインストール
- **MetaMask** - [ブラウザ拡張機能](https://metamask.io/)をインストール

**確認コマンド**:

```bash
node --version  # v18以上であることを確認
npm --version
docker --version
docker compose version
git --version
```

### ステップ 1: リポジトリのクローン

```bash
git clone <repository-url>
cd career-passport
```

### ステップ 2: Foundry のインストール

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

### ステップ 3: コントラクトのセットアップ

```bash
# contracts ディレクトリに移動
cd contracts

# OpenZeppelin Contracts のインストール
forge install OpenZeppelin/openzeppelin-contracts

# コントラクトのコンパイル
forge build
```

### ステップ 4: バックエンドのセットアップ

**ターミナル 1**: 新しいターミナルを開いて実行

```bash
cd backend

# 依存関係のインストール
npm install

# 環境変数ファイルの作成
cat > .env << 'EOF'
# DynamoDB 設定（Docker で起動した DynamoDB Local を使用）
AWS_REGION=ap-northeast-1
DYNAMODB_ENDPOINT=http://localhost:8000

# DynamoDB テーブル名
DYNAMODB_TABLE_EVENT_APPLICATIONS=NonFungibleCareerEventApplications
DYNAMODB_TABLE_MESSAGES=NonFungibleCareerMessages
DYNAMODB_TABLE_MATCHES=NonFungibleCareerMatches
DYNAMODB_TABLE_EVENTS=NonFungibleCareerEvents

# JWT 設定
JWT_SECRET=your-secret-key-change-in-production

# サーバー設定
PORT=3000
EOF

# DynamoDB Local (Docker) を起動
npm run dynamodb:up

# 数秒待ってから、DynamoDB テーブルを作成
sleep 5
npm run create-api-tables

# バックエンドAPIサーバーを起動
npm run dev
```

**確認**: ターミナルに `Backend running on 3000` と表示されれば成功です。

### ステップ 5: ローカルブロックチェーン（Anvil）の起動とコントラクトのデプロイ

**ターミナル 2**: 新しいターミナルを開いて実行

```bash
cd contracts

# Anvil を起動（このターミナルは起動したままにしておく）
anvil
```

**ターミナル 3**: 新しいターミナルを開いて実行

```bash
cd contracts

# コントラクトをデプロイ
bash scripts/deploy-all.sh
```

このスクリプトは以下を実行します：

1. `NonFungibleCareerNFT`をデプロイ
2. `StampManager`と`CareerStampSFT`をデプロイ
3. デプロイ済みアドレスを`deployed.json`に自動保存
4. コントラクト間の設定
5. 環境変数ファイル（`frontend/.env.local`）を自動生成
6. バックエンドデータベーステーブルの作成（オプション）

**確認**: `frontend/.env.local` ファイルが作成されていることを確認してください。

### ステップ 6: MetaMask の設定

1. MetaMask をインストール（まだの場合）
2. ローカルネットワーク（Anvil）を追加：
   - ネットワーク名: `Anvil Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - 通貨記号: `ETH`
3. （オプション）Anvil のテストアカウントをインポート
   - Anvil 起動時に表示されるプライベートキーを使用

### ステップ 7: フロントエンドのセットアップ

**ターミナル 4**: 新しいターミナルを開いて実行

```bash
cd frontend

# 依存関係のインストール
npm install

# フロントエンドを起動
npm run dev
```

**確認**: ターミナルに `Local: http://localhost:5173` と表示されれば成功です。

### ステップ 8: 動作確認

1. ブラウザで `http://localhost:5173` を開く
2. MetaMask でウォレットを接続
3. 以下の機能をテスト：
   - ホーム画面の表示
   - スタンプ一覧の表示
   - NFT 一覧の表示
   - イベント応募機能
   - メッセージ機能

### 起動確認チェックリスト

すべてのサービスが正常に起動しているか確認してください：

- ✅ **DynamoDB Local**: `docker ps` で `dynamodb-local` コンテナが起動中
- ✅ **バックエンド API**: `http://localhost:3000` にアクセス可能（またはターミナルに `Backend running on 3000` と表示）
- ✅ **Anvil**: ターミナルに `Listening on 127.0.0.1:8545` と表示
- ✅ **フロントエンド**: `http://localhost:5173` にアクセス可能

---

## 日常的なスタートアップ手順

PC を再起動した後や、一度セットアップを完了した環境でアプリを起動する場合の手順です。

### 必要なサービスを起動

以下の順序で 4 つのターミナルを開いて、それぞれのサービスを起動します：

#### ターミナル 1: DynamoDB Local とバックエンド API

```bash
cd backend

# DynamoDB Local を起動
npm run dynamodb:up

# 数秒待ってから、バックエンドAPIサーバーを起動
sleep 3
npm run dev
```

**確認**: `Backend running on 3000` と表示されれば成功です。

#### ターミナル 2: ローカルブロックチェーン（Anvil）

```bash
cd contracts
anvil
```

**確認**: `Listening on 127.0.0.1:8545` と表示されれば成功です。

**注意**: Anvil を再起動すると、以前のブロックチェーンの状態は失われます。コントラクトを再デプロイする必要があります。

#### ターミナル 3: コントラクトの再デプロイ（Anvil 再起動時のみ）

Anvil を再起動した場合のみ、このステップを実行してください：

```bash
cd contracts
bash scripts/deploy-all.sh
```

#### ターミナル 4: フロントエンド

```bash
cd frontend
npm run dev
```

**確認**: `Local: http://localhost:5173` と表示されれば成功です。

### クイックスタートスクリプト（オプション）

複数のサービスを一度に起動したい場合は、以下のスクリプトを使用できます：

```bash
# バックエンドのセットアップスクリプトを実行
bash scripts/setup-backend.sh
```

---

## アプリケーション仕様

### 主要機能の仕様

#### 1. スタンプシステム 🎫

**機能概要**:

- 企業が学生にスタンプを発行（ブロックチェーン上に記録）
- スタンプは企業別・カテゴリ別に管理
- 同じ企業からスタンプを 3 つ集めると NFT 証明書に交換可能

**技術仕様**:

- ブロックチェーン: `StampManager`コントラクト（ERC1155 準拠）
- データ保存: ブロックチェーン上に永続化
- 表示: フロントエンドでブロックチェーンから読み込み

#### 2. NFT 証明書 🏆

**機能概要**:

- 同じ企業からスタンプを 3 つ集めると NFT 証明書を取得可能
- NFT 証明書はブロックチェーン上に記録（改ざん不可）
- レアリティ（Common, Rare, Epic）を設定可能

**技術仕様**:

- ブロックチェーン: `NonFungibleCareerNFT`コントラクト（ERC721 準拠）
- 譲渡不可: NFT 証明書は譲渡できない仕様
- メタデータ: 名前、レアリティ、企業情報を含む

#### 3. イベント応募 📅

**機能概要**:

- 企業が NFT 獲得イベントを作成
- 学生がイベントに応募（応募動機、経験・スキルを入力）
- 企業が応募を確認・承認/拒否

**技術仕様**:

- データ保存: DynamoDB（`NonFungibleCareerEvents`, `NonFungibleCareerEventApplications`テーブル）
- API: RESTful API（Express.js）
- 認証: ウォレットアドレスによる認証

#### 4. メッセージ機能 💬

**機能概要**:

- 学生と企業間のメッセージ交換
- 会話管理（会話 ID によるグループ化）
- 既読管理

**技術仕様**:

- データ保存: DynamoDB（`NonFungibleCareerMessages`テーブル）
- 会話 ID: 送信者と受信者のアドレスをソートして結合
- API: RESTful API（Express.js）

#### 5. マッチング機能 🤝

**機能概要**:

- 学生と企業の条件をマッチング
- ZKP（ゼロ知識証明）で条件を満たすことを証明
- マッチング一覧の表示

**技術仕様**:

- データ保存: DynamoDB（`NonFungibleCareerMatches`テーブル）
- ZKP: VC（Verifiable Credential）から選択的に情報を開示
- API: RESTful API（Express.js）

#### 6. VC 管理・ZKP 生成 🔐

**機能概要**:

- VC（Verifiable Credential）の管理
- ゼロ知識証明（ZKP）の生成
- 選択的開示（必要な情報のみを開示）

**技術仕様**:

- VC 保存: ローカルストレージ（`/src/data/sample-vcs/`から動的読み込み）
- ZKP: モック実装（実際の ZKP 実装は今後の拡張）

---

## UI 遷移図

### 学生向け UI 遷移

```
/
└─> ユーザータイプ選択
    ├─> /student (学生)
    │   ├─> /student (ホーム)
    │   ├─> /student/mypage (マイページ)
    │   ├─> /student/nfts (NFT一覧)
    │   │   └─> /student/nft/:id (NFT詳細)
    │   ├─> /student/settings (VC管理・ZKP)
    │   ├─> /student/events (イベント一覧)
    │   │   └─> /student/events/:id/apply (イベント応募)
    │   ├─> /student/applications (応募履歴)
    │   ├─> /student/job-conditions (求人条件設定)
    │   ├─> /student/job-search (求人検索)
    │   ├─> /student/matched-companies (マッチング企業一覧)
    │   └─> /student/messages (メッセージ)
    │
    └─> /org (企業)
        ├─> /org (ダッシュボード)
        ├─> /org/stamp-issuance (スタンプ発行)
        ├─> /org/nft-issuance (NFT発行)
        ├─> /org/nfts (NFT一覧)
        │   └─> /org/nft/:id (NFT詳細)
        ├─> /org/events (イベント一覧)
        │   ├─> /org/events/create (イベント作成)
        │   └─> /org/events/:id/applications (応募一覧)
        ├─> /org/recruitment-conditions (人材募集条件設定)
        ├─> /org/candidate-search (候補者検索)
        ├─> /org/matched-candidates (マッチング候補者一覧)
        └─> /org/messages (メッセージ)
```

### 主要な画面遷移フロー

#### スタンプ獲得から NFT 取得まで

```
学生
  └─> イベント一覧 (/student/events)
      └─> イベント応募 (/student/events/:id/apply)
          └─> 企業が承認
              └─> スタンプ獲得（ブロックチェーンに記録）
                  └─> マイページ (/student/mypage)
                      └─> スタンプ3つでNFT交換可能
                          └─> NFT取得（ブロックチェーンに記録）
```

#### メッセージ交換フロー

```
学生/企業
  └─> メッセージ (/student/messages または /org/messages)
      └─> 新規会話開始（ウォレットアドレス入力）
          └─> メッセージ送信
              └─> 会話一覧に表示
```

#### マッチングフロー

```
学生
  └─> 求人条件設定 (/student/job-conditions)
      └─> 求人検索 (/student/job-search)
          └─> マッチング企業一覧 (/student/matched-companies)
              └─> ZKPで条件証明
                  └─> メッセージ送信
```

---

## ブロックチェーン設計

### ネットワーク設定

- **ネットワーク名**: Anvil Local
- **RPC URL**: `http://localhost:8545`
- **Chain ID**: `31337`
- **通貨記号**: `ETH`

### スマートコントラクト

#### 1. NonFungibleCareerNFT.sol

**概要**: NFT 証明書を発行するコントラクト（ERC721 準拠）

**主要機能**:

- NFT 発行（`mint`関数）
- NFT 情報取得（`getTokenName`, `getTokenRarity`, `getTokenOrganizations`）
- 譲渡不可（`_update`関数で譲渡を制限）

**コントラクトアドレス**: `deployed.json`に保存（デプロイ時に自動生成）

**主要関数**:

```solidity
function mint(
    address to,
    string memory uri,
    string memory name,
    string memory rarity,
    string[] memory organizations
) public onlyOwner returns (uint256)

function getTokenName(uint256 tokenId) public view returns (string memory)
function getTokenRarity(uint256 tokenId) public view returns (string memory)
function getTokenOrganizations(uint256 tokenId) public view returns (string[] memory)
```

#### 2. StampManager.sol

**概要**: スタンプを管理するコントラクト

**主要機能**:

- スタンプ発行（`issueStamp`関数）
- スタンプ一覧取得（`getUserStamps`関数）
- NFT 交換条件判定（`canMintNFT`関数）

**コントラクトアドレス**: `deployed.json`に保存（デプロイ時に自動生成）

**主要関数**:

```solidity
function issueStamp(
    address user,
    string memory name,
    string memory organization,
    string memory category
) public onlyOwner

function getUserStamps(address user) public view returns (Stamp[] memory)
function canMintNFT(address user, string memory organization) public view returns (bool)
```

#### 3. CareerStampSFT.sol

**概要**: スタンプを発行する SFT（Semi-Fungible Token）コントラクト（ERC1155 準拠）

**主要機能**:

- スタンプ発行（`StampManager`経由で呼び出し）
- スタンプ一覧取得

**コントラクトアドレス**: `deployed.json`に保存（デプロイ時に自動生成）

### デプロイ手順

1. Anvil を起動
2. `bash scripts/deploy-all.sh`を実行
3. コントラクトアドレスが`deployed.json`に自動保存
4. 環境変数ファイル（`frontend/.env.local`）が自動生成

### コントラクト間の関係

```
NonFungibleCareerNFT (ERC721)
    ↑
    │ (NFT発行)
    │
StampManager
    │
    │ (スタンプ発行)
    │
CareerStampSFT (ERC1155)
```

---

## データベース設計

### 概要

本アプリケーションでは、**DynamoDB** を使用してデータを管理しています。開発環境では **DynamoDB Local (Docker)** を使用し、本番環境では **AWS DynamoDB** を使用できます。

### データストレージの構成

```
┌─────────────────────────────────────────┐
│         DynamoDB (DynamoDB Local)      │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Events テーブル                │  │
│  │  (イベントデータ)               │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  EventApplications テーブル      │  │
│  │  (イベント応募データ)            │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Messages テーブル              │  │
│  │  (メッセージデータ)             │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Matches テーブル               │  │
│  │  (マッチングデータ)             │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         │
┌────────▼─────────────────────────────────┐
│   ブロックチェーン (Anvil)               │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  StampManager コントラクト       │  │
│  │  (スタンプデータ)                │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  NonFungibleCareerNFT コントラクト│ │
│  │  (NFT証明書データ)              │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**設計方針**:

- **ブロックチェーン**: スタンプと NFT 証明書のデータ（改ざん不可能な重要なデータ）
- **DynamoDB**: イベント、応募、メッセージ、マッチングのデータ（頻繁に更新されるデータ）

### テーブル設計

#### 1. イベントテーブル (`NonFungibleCareerEvents`)

イベント情報を管理します。

**プライマリキー**:

- `eventId` (String) - イベント ID（UUID）

**グローバルセカンダリインデックス (GSI)**:

- `OrgIndex` - `orgWalletAddress` で検索（企業別のイベント一覧取得）

**主要フィールド**:

- `eventId` (String) - イベント ID
- `orgWalletAddress` (String) - 作成者のウォレットアドレス
- `title` (String) - イベントタイトル
- `description` (String) - イベント説明
- `startDate` (String) - 開始日
- `endDate` (String) - 終了日
- `location` (String) - 開催場所
- `maxParticipants` (Number) - 最大参加者数
- `status` (String) - ステータス（`upcoming`, `active`, `completed`, `cancelled`）
- `createdAt` (String) - 作成日時
- `updatedAt` (String) - 更新日時

#### 2. イベント応募テーブル (`NonFungibleCareerEventApplications`)

イベントへの応募情報を管理します。

**プライマリキー**:

- `applicationId` (String) - 応募 ID（UUID）

**グローバルセカンダリインデックス (GSI)**:

- `EventIndex` - `eventId` で検索（イベント別の応募一覧取得）
- `WalletIndex` - `walletAddress` で検索（ユーザー別の応募一覧取得）

**主要フィールド**:

- `applicationId` (String) - 応募 ID
- `eventId` (String) - イベント ID
- `walletAddress` (String) - 応募者のウォレットアドレス
- `applicationText` (String) - 応募動機・経験・スキル
- `appliedAt` (String) - 応募日時（ISO 8601 形式）
- `status` (String) - ステータス（`pending`, `approved`, `rejected`）

#### 3. メッセージテーブル (`NonFungibleCareerMessages`)

学生と企業間のメッセージを管理します。

**プライマリキー**:

- `messageId` (String) - メッセージ ID（UUID）

**グローバルセカンダリインデックス (GSI)**:

- `ConversationIndex` - `conversationId` で検索（会話別のメッセージ一覧取得）
- `SenderIndex` - `senderAddress` で検索（送信者別のメッセージ一覧取得）

**主要フィールド**:

- `messageId` (String) - メッセージ ID
- `conversationId` (String) - 会話 ID（送信者と受信者のアドレスをソートして結合）
- `senderAddress` (String) - 送信者のウォレットアドレス
- `receiverAddress` (String) - 受信者のウォレットアドレス
- `content` (String) - メッセージ内容
- `sentAt` (String) - 送信日時（ISO 8601 形式）
- `read` (Boolean) - 既読フラグ

**会話 ID の生成ロジック**:

```javascript
// 送信者と受信者のアドレスを小文字に変換してソートし、アンダースコアで結合
conversationId = `${address1.toLowerCase()}_${address2.toLowerCase()}`;
// 例: "0x1111..._0x2222..."
```

#### 4. マッチングテーブル (`NonFungibleCareerMatches`)

学生と企業のマッチング情報を管理します。

**プライマリキー**:

- `matchId` (String) - マッチング ID（UUID）

**グローバルセカンダリインデックス (GSI)**:

- `StudentIndex` - `studentAddress` で検索（学生別のマッチング一覧取得）
- `OrgIndex` - `orgAddress` で検索（企業別のマッチング一覧取得）

**主要フィールド**:

- `matchId` (String) - マッチング ID
- `studentAddress` (String) - 学生のウォレットアドレス
- `orgAddress` (String) - 企業のウォレットアドレス
- `zkpProofHash` (String, nullable) - ZKP 証明のハッシュ（オプション）
- `matchedAt` (String) - マッチング日時（ISO 8601 形式）
- `status` (String) - ステータス（`active`, `closed`）

### テーブル作成方法

```bash
cd backend
npm run create-api-tables
```

このコマンドで、上記の 4 つのテーブルが作成されます。

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
                │
                │ (HTTP API)
                │
┌───────────────▼────────────────────────┐
│    Backend API (Express.js)            │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Event Routes                   │  │
│  │  Message Routes                 │  │
│  │  Match Routes                   │  │
│  └─────────────────────────────────┘  │
│                │                        │
│         ┌─────▼─────┐                  │
│         │ DynamoDB   │                  │
│         │  Local     │                  │
│         └────────────┘                  │
└─────────────────────────────────────────┘
```

### 技術スタック

**フロントエンド**:

- React 19 + Vite
- Tailwind CSS
- React Router
- Ethers.js v6

**バックエンド**:

- Node.js + Express.js
- AWS SDK (DynamoDB)
- DynamoDB Local (Docker)

**ブロックチェーン**:

- Foundry
- Solidity 0.8.20
- Anvil（ローカルブロックチェーン）
- OpenZeppelin

**開発ツール**:

- MetaMask
- Git
- Docker

---

## 詳細手順書

### 📋 詳細手順書（Day 別）

- **[Day 3 セットアップガイド](./doc/DAY3_FOUNDRY_SETUP_GUIDE.md)**: Foundry セットアップとコントラクト実装
- **[Day 4 テストとデプロイガイド](./doc/DAY4_TEST_AND_DEPLOY_GUIDE.md)**: テストとデプロイ手順
- **[Day 5 MetaMask 連携ガイド](./doc/DAY5_WALLET_INTEGRATION_GUIDE.md)**: ウォレット連携実装
- **[Day 6 ブロックチェーン統合ガイド](./doc/DAY6_BLOCKCHAIN_INTEGRATION_GUIDE.md)**: UI とブロックチェーンの統合
- **[Day 7 バックエンド API 実装ガイド](./doc/DAY7_BACKEND_API_GUIDE.md)**: バックエンド API の実装とフロントエンド統合
- **[Day 8 テストとアプリ完成度向上ガイド](./doc/DAY8_TESTING_AND_COMPLETION_GUIDE.md)**: テストとアプリ完成度向上
- **[バックエンドガイド](./backend/GUIDE.md)**: バックエンド API の起動手順とテスト手順

---

## トラブルシューティング

### Foundry がインストールされない場合

```bash
foundryup
```

### コントラクトのコンパイルエラー

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --force
forge build
```

### Anvil に接続できない場合

```bash
# Anvilが起動しているか確認
curl http://localhost:8545
```

### DynamoDB Local が起動しない場合

```bash
cd backend
# Dockerが起動しているか確認
docker ps

# DynamoDB Localを再起動
npm run dynamodb:down
npm run dynamodb:up

# ログを確認
npm run dynamodb:logs
```

### バックエンド API に接続できない場合

```bash
cd backend
# テーブルが作成されているか確認
npm run create-api-tables

# サーバーを再起動
npm run dev
```

### フロントエンドが起動しない場合

```bash
cd frontend
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# 環境変数ファイルを確認
cat .env.local
```

---

**最終更新**: 2025 年 12 月 11 日（Day 8 完了・プロジェクト完了）
