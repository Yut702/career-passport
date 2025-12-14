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
  - 求人/採用条件 API ✅
  - ZKP 証明 API ✅
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
- マッチング企業一覧・詳細
- メッセージ機能（企業アドレス自動入力）
- VC 管理・ZKP 生成・保存
- 検証済み ZKP 証明の選択

#### ✅ 企業向け機能

- ウォレット接続
- スタンプ発行
- NFT 証明書発行
- イベント作成・管理
- 応募確認・承認/拒否
- 人材募集条件設定
- 候補者検索
- マッチング候補者一覧・詳細（成立したマッチング表示）
- メッセージ機能（候補者アドレス自動入力）
- 学生のスタンプ・NFT・ZKP 証明の確認

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
DYNAMODB_TABLE_ZKP_PROOFS=NonFungibleCareerZKPProofs

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

# Anvil を状態保存付きで起動（推奨）
bash scripts/start-anvil.sh
```

または、手動で起動する場合：

```bash
cd contracts
anvil --state anvil-state.json
```

**確認**: `Listening on 127.0.0.1:8545` と表示されれば成功です。

**ターミナル 3**: 新しいターミナルを開いて実行

```bash
cd contracts

# コントラクトをデプロイ（初回のみ）
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

**重要**:

- 初回のみコントラクトをデプロイする必要があります
- `--state` オプションを使用しているため、Anvil を再起動しても状態が保持されます
- 状態をリセットしたい場合は `bash scripts/reset-anvil.sh` を実行してください

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

### 初回セットアップ完了チェックリスト

すべてのステップが完了しているか確認してください：

- ✅ **Foundry**: `forge --version`、`anvil --version` が正常に動作
- ✅ **コントラクト**: `forge build` が成功し、`contracts/lib/` に依存関係がインストールされている
- ✅ **バックエンド**: `.env` ファイルが作成され、`npm run create-api-tables` でテーブルが作成済み
- ✅ **Anvil**: 状態保存付きで起動し、`contracts/anvil-state.json` が作成されている
- ✅ **コントラクト**: `contracts/deployed.json` にアドレスが記録されている
- ✅ **フロントエンド**: `frontend/.env.local` ファイルが作成されている
- ✅ **MetaMask**: ローカルネットワーク（Anvil）が追加されている

**次のステップ**: セットアップが完了したら、「[日常的な起動手順](#日常的な起動手順)」を参照してアプリを起動してください。

---

## 日常的な起動手順

PC を再起動した後や、一度セットアップを完了した環境でアプリを起動する場合の手順です。

### 前提条件

- ✅ 初期セットアップが完了していること
- ✅ コントラクトがデプロイ済みであること（初回のみ必要）

### 起動手順

以下の順序で **3〜4 つのターミナル**を開いて、それぞれのサービスを起動します：

#### ターミナル 1: DynamoDB Local とバックエンド API

```bash
cd backend

# DynamoDB Local を起動
npm run dynamodb:up

# 数秒待ってから、バックエンドAPIサーバーを起動
sleep 3
npm run dev
```

**確認**:

- `Backend running on 3000` と表示されれば成功です
- または `docker ps` で `dynamodb-local` コンテナが起動中であることを確認

**注意**:

- DynamoDB Local のデータは Docker ボリュームに保存されるため、コンテナを削除しない限りデータは保持されます
- テーブルは既に作成されているため、再作成の必要はありません

#### ターミナル 2: ローカルブロックチェーン（Anvil）

**推奨方法（状態を保存）**:

```bash
cd contracts
bash scripts/start-anvil.sh
```

**確認**: `Listening on 127.0.0.1:8545` と表示されれば成功です。

**状態管理について**:

- `--state` オプションを使用しているため、Anvil を再起動しても以前の状態（コントラクト、トランザクション、残高）が自動的に復元されます
- 状態ファイル（`anvil-state.json`）が存在する場合、以前の状態が復元されます
- 状態ファイルが存在しない場合（初回起動時など）、新しい状態で開始されます

**状態をリセットする場合**:

```bash
cd contracts
bash scripts/reset-anvil.sh
```

#### ターミナル 3: コントラクトのデプロイ（初回のみ、または状態リセット時）

**⚠️ このステップは初回のみ、または Anvil の状態をリセットした場合のみ必要です**

状態ファイル（`anvil-state.json`）が存在し、以前の状態が復元されている場合は、このステップをスキップしてください。

```bash
cd contracts
bash scripts/deploy-all.sh
```

**確認**:

- `frontend/.env.local` ファイルが存在することを確認
- デプロイスクリプトが正常に完了したことを確認

**注意**:

- 状態ファイルが存在する場合、デプロイスクリプトは警告を表示します
- 既存のコントラクトアドレスが上書きされる可能性があります

#### ターミナル 4: フロントエンド

```bash
cd frontend
npm run dev
```

**確認**: `Local: http://localhost:5173` と表示されれば成功です。

### 起動確認チェックリスト

すべてのサービスが正常に起動しているか確認してください：

- ✅ **DynamoDB Local**: `docker ps` で `dynamodb-local` コンテナが起動中
- ✅ **バックエンド API**: `http://localhost:3000` にアクセス可能（またはターミナルに `Backend running on 3000` と表示）
- ✅ **Anvil**: ターミナルに `Listening on 127.0.0.1:8545` と表示
- ✅ **フロントエンド**: `http://localhost:5173` にアクセス可能
- ✅ **コントラクト**: `contracts/deployed.json` にアドレスが記録されている（初回デプロイ後）

### よくある質問

**Q: 毎回コントラクトをデプロイする必要がありますか？**

A: いいえ。`--state` オプションを使用しているため、Anvil を再起動しても状態が保持されます。初回のみ、または状態をリセットした場合のみデプロイが必要です。

**Q: 状態をリセットしたい場合はどうすればいいですか？**

A: `cd contracts && bash scripts/reset-anvil.sh` を実行してください。その後、コントラクトを再デプロイする必要があります。

**Q: DynamoDB のデータが消えた場合は？**

A: `docker compose down -v` を実行していない限り、データは保持されます。データをリセットしたい場合は、`cd backend && docker compose down -v` を実行してください。

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
- マッチング作成時に自動メッセージ送信

**技術仕様**:

- データ保存: DynamoDB（`NonFungibleCareerMatches`テーブル）
- ZKP: VC（Verifiable Credential）から選択的に情報を開示
- API: RESTful API（Express.js）
- 自動メッセージ: マッチング作成成功時に学生から企業への初期メッセージを自動送信

#### 6. 求人/採用条件設定 📋

**機能概要**:

- 学生が求人条件を設定・保存
- 企業が採用条件を設定・保存
- 条件に基づいた自動マッチング（カテゴリ一致でマッチング候補を表示）

**技術仕様**:

- データ保存: DynamoDB（`NonFungibleCareerJobConditions`, `NonFungibleCareerRecruitmentConditions`テーブル）
- API: RESTful API（Express.js）
- マッチング条件: 職種カテゴリが一致すればマッチング候補として表示

#### 7. VC 管理・ZKP 生成・保存 🔐

**機能概要**:

- VC（Verifiable Credential）の管理（W3C 形式対応）
- ゼロ知識証明（ZKP）の生成（TOEIC、学位証明に対応）
- 選択的開示（必要な情報のみを開示）
- 検証済み ZKP 証明の保存と選択

**技術仕様**:

- VC 保存: ローカルファイル（`/src/data/sample-vcs/`から動的読み込み、W3C 形式のみ）
- ZKP 生成: Circom 回路を使用（`toeic.circom`, `degree.circom`）
- ZKP 保存:
  - 完全な証明データ: `frontend/src/data/zkp-proofs/`に JSON ファイルとして保存
  - 公開情報のみ: DynamoDB（`NonFungibleCareerZKPProofs`テーブル）に保存
- 求人条件での選択: 検証済み ZKP 証明を求人条件に紐付けて選択可能

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
      └─> ZKP証明を選択（検証済み）
          └─> 求人検索 (/student/job-search)
              └─> マッチング企業一覧 (/student/matched-companies)
                  └─> 企業詳細を確認
                      └─> マッチングを作成
                          └─> 自動メッセージ送信
                              └─> メッセージ画面（企業アドレス自動入力）

企業
  └─> 採用条件設定 (/org/recruitment-conditions)
      └─> 候補者検索 (/org/candidate-search)
          └─> 成立したマッチング一覧を確認
              └─> 候補者詳細を確認
                  └─> スタンプ・NFT・ZKP証明を確認
                      └─> メッセージ送信（候補者アドレス自動入力）
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

## NFT/SFT の保管場所と画像設計

### 概要

このアプリケーションでは、**SFT（Semi-Fungible Token）**と**NFT（Non-Fungible Token）**のデータをブロックチェーン上に保存しています。現在は PoC（Proof of Concept）段階のため、画像はエモジとグラデーションで表示していますが、将来的には IPFS などの分散ストレージを使用して画像を保存する設計となっています。

### データの保管場所

#### 1. SFT（スタンプ）の保管場所

**ブロックチェーン上（Anvil）**:

- **コントラクト**: `CareerStampSFT`（ERC1155 準拠）
- **メタデータ**: `StampMetadata`構造体としてブロックチェーン上に保存
  - `name`: スタンプ名
  - `organization`: 発行企業名
  - `category`: カテゴリ（finance, marketing, business, programming, design）
  - `createdAt`: 作成日時（Unix タイムスタンプ）
- **URI**: `uri(uint256 tokenId)`関数でメタデータ URI を返す
  - 現在の実装: `https://api.career-passport.com/stamps/{tokenId}.json`（簡易的な URI 生成）
  - 将来的には IPFS URI を返す設計

**フロントエンド表示**:

- カテゴリ別のエモジで表示（💰、📊、💼、💻、🎨）
- カテゴリに応じたグラデーション背景
- 実際の画像ファイルは使用していない（PoC 段階）

#### 2. NFT（証明書）の保管場所

**ブロックチェーン上（Anvil）**:

- **コントラクト**: `NonFungibleCareerNFT`（ERC721 準拠）
- **メタデータ**: コントラクト内のマッピングに保存
  - `_tokenUrIs`: メタデータ URI（IPFS や HTTP URL）
  - `_tokenNames`: トークン名
  - `_tokenRarities`: レアリティ（Common, Rare, Epic, Legendary）
  - `_tokenOrganizations`: 関連組織の配列
- **URI**: `tokenURI(uint256 tokenId)`関数でメタデータ URI を返す
  - 現在の実装: `mint`関数で指定された URI をそのまま保存
  - 将来的には IPFS URI を返す設計

**フロントエンド表示**:

- エモジ（🏆）とレアリティに応じたグラデーション背景で表示
- レアリティ別の色分け:
  - Common: グレー系
  - Rare: ブルー系
  - Epic: パープル系
  - Legendary: イエロー → オレンジ → レッドのグラデーション
- 実際の画像ファイルは使用していない（PoC 段階）

### 現在の画像表示方法（PoC 段階）

#### SFT（スタンプ）の表示

```javascript
// frontend/src/components/StampCard.jsx
const getCategoryEmoji = (category) => {
  const emojis = {
    finance: "💰",
    marketing: "📊",
    business: "💼",
    programming: "💻",
    design: "🎨",
  };
  return emojis[category] || "🎫";
};
```

- カテゴリに応じたエモジを表示
- カテゴリに応じたグラデーション背景を適用

#### NFT（証明書）の表示

```javascript
// frontend/src/components/NFTCard.jsx
const getRarityGradient = (rarity) => {
  const gradients = {
    common: "from-gray-400 to-gray-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-yellow-400 via-orange-400 to-red-500",
  };
  return gradients[rarity] || gradients.common;
};
```

- レアリティに応じたグラデーション背景を適用
- エモジ（🏆）を中央に表示

### 将来の設計思想

#### 画像の保存方法

**推奨: IPFS（InterPlanetary File System）**

IPFS は分散ストレージプロトコルで、以下のメリットがあります：

1. **分散性**: 単一のサーバーに依存しない
2. **永続性**: コンテンツアドレッシングにより、同じコンテンツは同じハッシュを持つ
3. **改ざん不可能**: ハッシュベースのアドレッシングにより、コンテンツの整合性を保証
4. **コスト効率**: 中央集権的なサーバーを必要としない

#### 実装方針

**1. メタデータ JSON の構造**

ERC721/ERC1155 の標準メタデータ形式に準拠：

```json
{
  "name": "優秀な成績証明書",
  "description": "東京大学から発行された優秀な成績証明書です。",
  "image": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "attributes": [
    {
      "trait_type": "レアリティ",
      "value": "Epic"
    },
    {
      "trait_type": "企業",
      "value": "東京大学"
    }
  ]
}
```

**2. IPFS へのアップロードフロー**

```
1. 画像ファイルを生成（SVG、PNG、JPEGなど）
   ↓
2. IPFSにアップロード
   ↓
3. IPFSハッシュ（CID）を取得
   ↓
4. メタデータJSONを作成（imageフィールドにIPFS URIを設定）
   ↓
5. メタデータJSONをIPFSにアップロード
   ↓
6. メタデータのIPFS URIをコントラクトに保存
```

**3. コントラクトの実装例**

```solidity
// NFT発行時にIPFS URIを指定
function mint(
    address to,
    string memory ipfsMetadataURI,  // ipfs://Qm...形式
    string memory name,
    string memory rarity,
    string[] memory organizations
) public onlyOwner returns (uint256) {
    // ...
    _tokenUrIs[tokenId] = ipfsMetadataURI;
    // ...
}
```

**4. フロントエンドでの表示**

```javascript
// IPFS URIから画像を取得
const metadataURI = await nftContract.tokenURI(tokenId);
// ipfs://Qm... → https://ipfs.io/ipfs/Qm... に変換
const httpURI = metadataURI.replace("ipfs://", "https://ipfs.io/ipfs/");
const metadata = await fetch(httpURI).then((res) => res.json());
const imageURI = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
```

#### 代替案

**1. Arweave**

- 永続的なストレージ（一度アップロードすると永続的に保存）
- ワンタイムペイメントモデル
- IPFS よりも永続性が高い

**2. 中央集権的なサーバー（非推奨）**

- AWS S3、Google Cloud Storage など
- 単一障害点となる
- サーバーコストが継続的に発生
- ブロックチェーンの分散性のメリットを損なう

#### 実装時の考慮事項

1. **IPFS ピンサービス**: IPFS ノードがオフラインになるとコンテンツにアクセスできなくなるため、ピンサービス（Pinata、Infura IPFS など）の使用を検討
2. **フォールバック**: IPFS へのアクセスに失敗した場合のフォールバック（現在のエモジ表示など）を実装
3. **画像の最適化**: ファイルサイズを最小化し、IPFS へのアップロードコストを削減
4. **メタデータのバージョン管理**: メタデータの更新が必要な場合の対応方法を検討

### まとめ

- **現在（PoC 段階）**: エモジとグラデーションで表示、実際の画像ファイルは使用しない
- **将来（本番環境）**: IPFS を使用して画像とメタデータを保存し、分散ストレージのメリットを活用
- **設計方針**: ERC721/ERC1155 の標準メタデータ形式に準拠し、IPFS URI をコントラクトに保存

---

## 状態管理とデータ同期

### 概要

このアプリケーションでは、以下の 3 つのデータストレージが存在します：

1. **Anvil（ローカルブロックチェーン）**: SFT/NFT の状態を保存
2. **Docker（DynamoDB Local）**: イベント、応募、メッセージなどのデータを保存
3. **ローカルストレージ（ブラウザ）**: フロントエンドのキャッシュとして使用

### Anvil の状態管理

#### 状態を保存して起動する（推奨）

```bash
cd contracts
bash scripts/start-anvil.sh
```

または、手動で起動する場合：

```bash
cd contracts
anvil --state anvil-state.json
```

**メリット**:

- 再起動後もブロックチェーンの状態が保持される
- 以前発行した SFT/NFT が残る
- コントラクトアドレスが変わらない（同じ nonce でデプロイする場合）

**状態ファイル**:

- ファイル名: `anvil-state.json`
- 場所: `contracts/` ディレクトリ
- Git にはコミットしない（`.gitignore`に追加済み）

#### 状態をリセットする

```bash
cd contracts
bash scripts/reset-anvil.sh
```

または、手動で削除：

```bash
cd contracts
rm anvil-state.json
```

**注意**: 状態をリセットすると、以前のブロックチェーンの状態がすべて失われます。コントラクトを再デプロイする必要があります。

### Docker（DynamoDB Local）の状態管理

DynamoDB Local は Docker ボリュームにデータを保存します：

```yaml
volumes:
  - dynamodb-data:/home/dynamodblocal/data
```

**データの保持**:

- コンテナを削除しない限り、データは保持されます
- `docker compose down`を実行しても、ボリュームが削除されなければデータは残ります

**データをリセットする**:

```bash
cd backend
docker compose down -v  # -vオプションでボリュームも削除
```

### ローカルストレージ（ブラウザ）の状態管理

フロントエンドは、ブロックチェーンから取得したデータをローカルストレージにキャッシュします。

**保存されるデータ**:

- スタンプデータ
- NFT データ
- ユーザー情報
- コントラクトバージョン情報

**自動同期機能**:

- コントラクトアドレスが変更されると、自動的にローカルストレージがクリアされます
- ブロックチェーンからデータを読み込むと、自動的にローカルストレージに保存されます

**ローカルストレージをクリアする**:

1. **ブラウザの開発者ツールを使用**:

   - Chrome/Edge: F12 → Application → Local Storage → すべて削除
   - Firefox: F12 → Storage → Local Storage → すべて削除

2. **クリーンアップツールを使用**:

   ```bash
   # frontend/scripts/clean-local-storage.html をブラウザで開く
   ```

3. **ブラウザのコンソールで実行**:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### データ同期の仕組み

#### 同期フロー

```
1. フロントエンド起動
   ↓
2. コントラクトアドレスのバージョンチェック
   ↓
3. アドレスが変更されていた場合 → ローカルストレージをクリア
   ↓
4. ブロックチェーンからデータを読み込む
   ↓
5. ローカルストレージに保存（キャッシュ）
   ↓
6. 次回アクセス時は、まずローカルストレージから読み込む
   ↓
7. 必要に応じてブロックチェーンから再読み込み
```

#### 同期のタイミング

- **アプリ起動時**: ブロックチェーンからデータを読み込み、ローカルストレージに保存
- **データ更新時**: ブロックチェーンから最新データを取得し、ローカルストレージを更新
- **コントラクトアドレス変更時**: ローカルストレージを自動クリア

### 状態管理のベストプラクティス

#### 開発時の推奨フロー

1. **初回セットアップ**:

   ```bash
   # 1. Anvilを状態保存付きで起動
   cd contracts
   bash scripts/start-anvil.sh

   # 2. コントラクトをデプロイ
   bash scripts/deploy-all.sh

   # 3. DynamoDB Localを起動
   cd ../backend
   npm run dynamodb:up
   ```

2. **日常的な起動**:

   ```bash
   # 1. Anvilを起動（状態が自動復元される）
   cd contracts
   bash scripts/start-anvil.sh

   # 2. DynamoDB Localを起動（データは保持されている）
   cd ../backend
   npm run dynamodb:up
   ```

3. **状態をリセットしたい場合**:

   ```bash
   # Anvilの状態をリセット
   cd contracts
   bash scripts/reset-anvil.sh
   bash scripts/deploy-all.sh

   # DynamoDBのデータをリセット
   cd ../backend
   docker compose down -v
   npm run dynamodb:up
   ```

#### トラブルシューティング

**問題**: コントラクトアドレスが変わってしまった

**解決策**:

1. Anvil の状態ファイル（`anvil-state.json`）が存在するか確認
2. 同じ nonce でデプロイする場合は、コントラクトアドレスは変わらない
3. 状態ファイルを削除した場合は、新しいアドレスでデプロイされる

**問題**: ローカルストレージに古いデータが残っている

**解決策**:

1. ブラウザの開発者ツールでローカルストレージをクリア
2. アプリを再読み込み
3. ブロックチェーンから最新データを読み込む

**問題**: DynamoDB のデータが消えた

**解決策**:

1. `docker compose down -v`を実行していないか確認
2. ボリュームが削除されていないか確認: `docker volume ls`
3. 必要に応じて、テーブルを再作成: `npm run create-api-tables`

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
│  ┌─────────────────────────────────┐  │
│  │  JobConditions テーブル          │  │
│  │  (求人条件データ)                │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  RecruitmentConditions テーブル │  │
│  │  (採用条件データ)               │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  ZKPProofs テーブル             │  │
│  │  (ZKP証明公開情報)              │  │
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

#### 5. 求人条件テーブル (`NonFungibleCareerJobConditions`)

学生の求人条件を管理します。

**プライマリキー**:

- `walletAddress` (String) - 学生のウォレットアドレス

**主要フィールド**:

- `walletAddress` (String) - 学生のウォレットアドレス
- `jobType` (String) - 仕事の種類（`internship`, `fulltime`）
- `positionCategory` (String) - 職種カテゴリ
- `position` (String, optional) - 具体的な職種
- `location` (String, optional) - 勤務地
- `industry` (String, optional) - 業界
- `salary` (String, optional) - 希望給与
- `workStyle` (String, optional) - 働き方（`remote`, `hybrid`, `office`）
- `skills` (Array, optional) - 希望スキル
- `selectedZKPProofs` (Array, optional) - 選択された ZKP 証明 ID のリスト
- `createdAt` (String) - 作成日時
- `updatedAt` (String) - 更新日時

#### 6. 採用条件テーブル (`NonFungibleCareerRecruitmentConditions`)

企業の採用条件を管理します。

**プライマリキー**:

- `orgAddress` (String) - 企業のウォレットアドレス

**主要フィールド**:

- `orgAddress` (String) - 企業のウォレットアドレス
- `jobType` (String) - 仕事の種類（`internship`, `fulltime`）
- `positionCategory` (String) - 職種カテゴリ
- `position` (String, optional) - 具体的な職種
- `location` (String, optional) - 勤務地
- `industry` (String, optional) - 業界
- `salary` (String, optional) - 給与
- `workStyle` (String, optional) - 働き方（`remote`, `hybrid`, `office`）
- `requiredSkills` (Array, optional) - 必須スキル
- `preferredSkills` (Array, optional) - 希望スキル
- `description` (String, optional) - 説明
- `createdAt` (String) - 作成日時
- `updatedAt` (String) - 更新日時

#### 7. ZKP 証明テーブル (`NonFungibleCareerZKPProofs`)

ZKP 証明の公開情報を管理します（完全な証明データは`frontend/src/data/zkp-proofs/`に保存）。

**プライマリキー**:

- `proofId` (String) - 証明 ID（`proofHash_timestamp_random`形式）

**グローバルセカンダリインデックス (GSI)**:

- `WalletIndex` - `walletAddress` で検索（ウォレット別の証明一覧取得）

**主要フィールド**:

- `proofId` (String) - 証明 ID
- `walletAddress` (String) - ウォレットアドレス
- `proofHash` (String) - 証明のハッシュ
- `publicInputs` (Object) - 公開入力情報
- `usedVCs` (Array) - 使用された VC のリスト
- `satisfiedConditions` (Array) - 満たされた条件のリスト
- `verified` (Boolean) - 検証済みフラグ
- `verifiedAt` (String) - 検証日時

### テーブル作成方法

```bash
cd backend
npm run create-api-tables
```

このコマンドで、上記の 7 つのテーブルが作成されます。

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
│  │  JobCondition Routes            │  │
│  │  ZKPProof Routes                │  │
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

---

## 最新の機能追加（2025 年 12 月 13 日）

### ✅ 追加された機能

1. **求人/採用条件のデータベース保存**

   - 学生の求人条件を DynamoDB に保存
   - 企業の採用条件を DynamoDB に保存
   - 条件保存時に成功メッセージを表示

2. **自動マッチング機能**

   - 職種カテゴリが一致する企業/学生を自動的にマッチング候補として表示
   - 学生側: `/student/job-search`でマッチング企業を表示
   - 企業側: `/org/candidate-search`でマッチング候補者を表示

3. **成立したマッチングの表示**

   - 企業側で成立したマッチング一覧を表示
   - マッチング詳細画面で学生の情報を確認可能

4. **ZKP 証明の保存と選択**

   - 検証済み ZKP 証明を`frontend/src/data/zkp-proofs/`に保存
   - 公開情報のみを DynamoDB に保存
   - 求人条件設定時に検証済み ZKP 証明を選択可能

5. **マッチング作成時の自動メッセージ送信**

   - マッチング作成成功時に、学生から企業への初期メッセージを自動送信
   - メッセージ内容: "マッチングが成立しました。よろしくお願いします。"

6. **メッセージ画面の改善**

   - マッチング画面から遷移した際、宛先アドレスが自動入力される
   - 学生側: 求人詳細から「メッセージを送る」で企業アドレスが自動入力
   - 企業側: マッチング詳細から「メッセージを送る」で候補者アドレスが自動入力

7. **VC 管理の改善**
   - W3C 形式の VC のみを検証対象とする
   - 検証済み ZKP 証明がある VC に「✅ 検証済み」バッジを表示
   - マイナンバー（年齢証明）機能を削除

### 📊 データベーステーブル

新規追加されたテーブル:

- `NonFungibleCareerJobConditions` - 学生の求人条件
- `NonFungibleCareerRecruitmentConditions` - 企業の採用条件
- `NonFungibleCareerZKPProofs` - ZKP 証明の公開情報

### 🔌 API エンドポイント

新規追加されたエンドポイント:

**求人条件 API**:

- `POST /api/job-conditions` - 学生の求人条件を保存
- `GET /api/job-conditions?walletAddress=...` - 学生の求人条件を取得
- `POST /api/job-conditions/recruitment` - 企業の採用条件を保存
- `GET /api/job-conditions/recruitment?orgAddress=...` - 企業の採用条件を取得

**マッチング検索 API**:

- `GET /api/matches/search/student?walletAddress=...` - 学生側のマッチング候補を検索
- `GET /api/matches/search/org?walletAddress=...` - 企業側のマッチング候補を検索

**ZKP 証明 API**:

- `POST /api/zkp-proofs` - ZKP 証明を保存（完全データはファイル、公開情報は DB）
- `GET /api/zkp-proofs?walletAddress=...` - ウォレット別の ZKP 証明一覧を取得
- `GET /api/zkp-proofs/:proofId` - 証明 ID で公開情報を取得
- `GET /api/zkp-proofs/:proofId/full` - 証明 ID で完全なデータを取得（ファイルから）

**マッチング API（機能追加）**:

- `POST /api/matches` - マッチング作成時に自動メッセージ送信機能を追加

---

**最終更新**: 2025 年 12 月 13 日（最新機能追加完了）
