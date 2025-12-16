# Non-Fungible Career

## 東京大学 ブロックチェーンイノベーション寄附講座

### MOF グループリポジトリ

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [セットアップガイド](#セットアップガイド)
   - [初期セットアップ](#初期セットアップ)
   - [日常的な起動手順](#日常的な起動手順)
   - [リセット方法](#リセット方法)
3. [機能仕様](#機能仕様)
4. [技術仕様](#技術仕様)
5. [UI 遷移図](#ui遷移図)
6. [システム設計](#システム設計)
   - [ブロックチェーン設計](#ブロックチェーン設計)
   - [データベース設計](#データベース設計)
   - [システムアーキテクチャ](#システムアーキテクチャ)
7. [詳細手順書](#詳細手順書)
8. [トラブルシューティング](#トラブルシューティング)

---

## プロジェクト概要

**Non-Fungible Career** は、ブロックチェーン技術を活用したキャリア証明書プラットフォームです。学生と企業を結びつけ、透明性とプライバシーを両立した人材マッチングを実現します。

### 主な機能

- 🎫 **スタンプシステム**: 企業が学生にスタンプを発行（ERC1155 準拠の SFT としてブロックチェーン上に記録）
- 🏆 **NFT 証明書**: 同じ企業からスタンプを 3 つ集めると NFT 証明書を申請可能（企業側で発行）
- 🔐 **ゼロ知識証明（ZKP）**: プライバシーを保護しながら条件を満たすことを証明
- 📅 **イベント応募**: NFT 獲得イベントへの応募機能（ZKP 証明データを含む）
- 💬 **メッセージ機能**: 学生と企業間のメッセージ交換
- 🤝 **マッチング機能**: 条件に合った学生と企業のマッチング
- 📊 **企業ダッシュボード**: スタンプ発行・統計管理
- 🏢 **企業管理**: VC（Verifiable Credentials）による企業名の認証と管理

---

## セットアップガイド

### 初期セットアップ

この手順に従うことで、Git プル後からアプリが正常に動作するまでを一通り実行できます。

#### 前提条件

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

#### ステップ 1: リポジトリのクローン

```bash
git clone <repository-url>
cd career-passport
```

#### ステップ 2: Foundry のインストール

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

#### ステップ 3: コントラクトのセットアップ

```bash
# contracts ディレクトリに移動
cd contracts

# OpenZeppelin Contracts のインストール
forge install OpenZeppelin/openzeppelin-contracts

# コントラクトのコンパイル
forge build
```

#### ステップ 4: バックエンドのセットアップ

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

# AWS認証情報（DynamoDB Local用）
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
EOF

# バックエンドを起動（データベースをリフレッシュして起動）
bash scripts/start-backend.sh
```

**確認**: ターミナルに `Backend running on 3000` と表示されれば成功です。

**注意**: このスクリプトは毎回 DynamoDB Local をリフレッシュ（データを削除）してから起動します。

#### ステップ 5: ローカルブロックチェーン（Anvil）の起動とコントラクトのデプロイ

**ターミナル 2**: 新しいターミナルを開いて実行

```bash
cd contracts

# Anvil を起動（毎回新しい状態で起動）
bash scripts/start-anvil.sh
```

**確認**: `Listening on 127.0.0.1:8545` と表示されれば成功です。

**ターミナル 3**: 新しいターミナルを開いて実行

```bash
cd contracts

# コントラクトをデプロイ（毎回実行が必要）
bash scripts/deploy-all.sh
```

このスクリプトは以下を実行します：

1. `NonFungibleCareerNFT`をデプロイ
2. `StampManager`と`CareerStampSFT`をデプロイ
3. デプロイ済みアドレスを`deployed.json`に自動保存
4. コントラクト間の設定
5. 環境変数ファイル（`frontend/.env.local`）を自動生成

**確認**: `frontend/.env.local` ファイルが作成されていることを確認してください。

**重要**:

- **毎回コントラクトをデプロイする必要があります**（Anvil は毎回新しい状態で起動します）
- Anvil の状態は保持されません（毎回リフレッシュされます）

#### ステップ 6: ウォレット接続の設定

このアプリケーションは **MetaMask** を使用してウォレット接続を行います。

##### MetaMask の設定（必須）

ローカル開発環境では、MetaMask をインストールし、Anvil Local ネットワークを追加する必要があります：

1. **MetaMask をインストール**

   - [MetaMask 公式サイト](https://metamask.io/)からブラウザ拡張機能をインストール

2. **ローカルネットワーク（Anvil）を追加**

   - MetaMask を開き、ネットワーク設定に移動
   - 「ネットワークを追加」をクリック
   - 以下の情報を入力：
     - **ネットワーク名**: `Anvil Local`
     - **RPC URL**: `http://localhost:8545`
     - **Chain ID**: `31337`
     - **通貨記号**: `ETH`
     - **ブロックエクスプローラー URL**: （空白のまま）

3. **（推奨）Anvil のテストアカウントをインポート**
   - Anvil 起動時に表示されるプライベートキーをコピー
   - MetaMask で「アカウントをインポート」を選択
   - プライベートキーを貼り付けてインポート

#### ステップ 7: フロントエンドのセットアップ

**ターミナル 4**: 新しいターミナルを開いて実行

```bash
cd frontend

# 依存関係のインストール
npm install

# フロントエンドを起動
npm run dev
```

**確認**: ターミナルに `Local: http://localhost:5173` と表示されれば成功です。

#### ステップ 8: 動作確認

1. ブラウザで `http://localhost:5173` を開く
2. 「ウォレット接続」ボタンをクリック
3. MetaMask の接続ダイアログが表示されます：
   - MetaMask で接続を承認すると、ウォレットが接続されます
4. 以下の機能をテスト：
   - ホーム画面の表示
   - スタンプ一覧の表示
   - NFT 一覧の表示
   - イベント応募機能
   - メッセージ機能

#### 初回セットアップ完了チェックリスト

すべてのステップが完了しているか確認してください：

- ✅ **Foundry**: `forge --version`、`anvil --version` が正常に動作
- ✅ **コントラクト**: `forge build` が成功し、`contracts/lib/` に依存関係がインストールされている
- ✅ **バックエンド**: `.env` ファイルが作成され、テーブルが作成済み
- ✅ **Anvil**: 起動し、`Listening on 127.0.0.1:8545` と表示されている
- ✅ **コントラクト**: `contracts/deployed.json` にアドレスが記録されている
- ✅ **フロントエンド**: `frontend/.env.local` ファイルが作成されている
- ✅ **MetaMask**: ローカルネットワーク（Anvil）が追加されている
- ✅ **ウォレット接続**: MetaMask を使用してウォレット接続

---

### 日常的な起動手順

PC を再起動した後や、一度セットアップを完了した環境でアプリを起動する場合の手順です。

**重要**: このアプリケーションは**毎回リフレッシュ**する前提で動作します。Anvil と DynamoDB Local のデータは保持されません。

#### 前提条件

- ✅ 初期セットアップが完了していること

#### 起動前の準備

**⚠️ 重要**: Anvil と DynamoDB Local が毎回リフレッシュされるため、フロントエンドのローカルストレージもクリアすることを推奨します。

**ローカルストレージをクリアする方法**:

**方法 1: ブラウザの開発者ツールを使用（推奨）**

1. ブラウザで開発者ツールを開く（F12）
2. Chrome/Edge: Application → Local Storage → `http://localhost:5173` → すべて削除
3. Firefox: Storage → Local Storage → `http://localhost:5173` → すべて削除

**方法 2: ブラウザのコンソールで実行**

1. ブラウザで開発者ツールを開く（F12）
2. Console タブで以下を実行：

```javascript
localStorage.clear();
location.reload();
```

#### 起動手順

以下の順序で **4 つのターミナル**を開いて、それぞれのサービスを起動します：

##### ターミナル 1: DynamoDB Local とバックエンド API

```bash
cd backend

# バックエンドを起動（データベースをリフレッシュして起動）
bash scripts/start-backend.sh
```

**確認**:

- `Backend running on 3000` と表示されれば成功です
- または `docker ps` で `dynamodb-local` コンテナが起動中であることを確認

**注意**:

- **毎回 DynamoDB Local をリフレッシュ**（データを削除）してから起動します
- テーブルは自動的に再作成されます

##### ターミナル 2: ローカルブロックチェーン（Anvil）

```bash
cd contracts
bash scripts/start-anvil.sh
```

**確認**: `Listening on 127.0.0.1:8545` と表示されれば成功です。

**注意**: **毎回新しい状態で起動**します（状態は保持されません）。

##### ターミナル 3: コントラクトのデプロイ

**⚠️ 毎回実行が必要です**

```bash
cd contracts
bash scripts/deploy-all.sh
```

**確認**:

- `frontend/.env.local` ファイルが存在することを確認
- デプロイスクリプトが正常に完了したことを確認

**注意**: Anvil は毎回新しい状態で起動するため、**毎回コントラクトをデプロイする必要があります**。

##### ターミナル 4: フロントエンド

```bash
cd frontend
npm run dev
```

**確認**: `Local: http://localhost:5173` と表示されれば成功です。

**注意**: ブラウザでアプリを開く前に、ローカルストレージをクリアすることを推奨します（上記の「起動前の準備」を参照）。

#### 起動確認チェックリスト

すべてのサービスが正常に起動しているか確認してください：

- ✅ **DynamoDB Local**: `docker ps` で `dynamodb-local` コンテナが起動中
- ✅ **バックエンド API**: `http://localhost:3000` にアクセス可能（またはターミナルに `Backend running on 3000` と表示）
- ✅ **Anvil**: ターミナルに `Listening on 127.0.0.1:8545` と表示
- ✅ **フロントエンド**: `http://localhost:5173` にアクセス可能
- ✅ **コントラクト**: `contracts/deployed.json` にアドレスが記録されている

---

### リセット方法

**注意**: このアプリケーションは**毎回リフレッシュ**する前提で動作するため、通常はリセット操作は不要です。起動時に自動的にリフレッシュされます。

#### フロントエンドのローカルストレージをリセット

**方法 1: ブラウザの開発者ツールを使用**

1. Chrome/Edge: F12 → Application → Local Storage → すべて削除
2. Firefox: F12 → Storage → Local Storage → すべて削除

**方法 2: ブラウザのコンソールで実行**

```javascript
localStorage.clear();
location.reload();
```

#### 手動でリセットする場合

通常は不要ですが、手動でリセットしたい場合：

```bash
# 1. Anvilを停止（Ctrl+C）して再起動
cd contracts
bash scripts/start-anvil.sh

# 2. コントラクトを再デプロイ
bash scripts/deploy-all.sh

# 3. バックエンドを再起動（自動的にリフレッシュされます）
cd ../backend
bash scripts/start-backend.sh
```

---

## Anvil スクリプトの説明

このプロジェクトでは、ローカルブロックチェーン（Anvil）を管理するためのスクリプトを提供しています。これらのスクリプトは `contracts/scripts/` ディレクトリに配置されています。

**重要**: このアプリケーションは**毎回リフレッシュ**する前提で動作します。Anvil の状態は保持されません。

### スクリプトの使い分け

| シナリオ         | 使用するスクリプト                 |
| ---------------- | ---------------------------------- |
| 初回セットアップ | `start-anvil.sh` → `deploy-all.sh` |
| 日常的な起動     | `start-anvil.sh` → `deploy-all.sh` |
| バックエンド起動 | `backend/scripts/start-backend.sh` |

### `scripts/start-anvil.sh`

**目的**: Anvil を起動するスクリプト（毎回新しい状態で起動）

**機能**:

- Anvil をローカルホスト（`127.0.0.1:8545`）で起動
- **毎回新しい状態で起動**します（状態は保持されません）

**使用方法**:

```bash
cd contracts
bash scripts/start-anvil.sh
```

**重要なポイント**:

- **状態は保持されません**（毎回リフレッシュされます）
- **毎回コントラクトをデプロイする必要があります**

**設定**:

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Port: `8545`

### `scripts/deploy-all.sh`

**目的**: すべてのスマートコントラクトを Anvil にデプロイし、必要な設定を自動化するスクリプト

**機能**:

1. **コントラクトのデプロイ**:

   - `NonFungibleCareerNFT` コントラクトをデプロイ
   - `StampManager` と `CareerStampSFT` コントラクトをデプロイ

2. **デプロイ済みアドレスの保存**:

   - デプロイされたコントラクトのアドレスを `deployed.json` に自動保存

3. **コントラクト間の設定**:

   - NFT コントラクトの所有者を StampManager に設定
   - StampManager に NFT コントラクトのアドレスを設定

4. **環境変数ファイルの生成**:

   - フロントエンドで使用する環境変数ファイル（`frontend/.env.local`）を自動生成

5. **バックエンドデータベーステーブルの作成**（オプション）:
   - DynamoDB Local が起動している場合、必要なテーブルを作成

**使用方法**:

```bash
cd contracts
bash scripts/deploy-all.sh
```

**重要なポイント**:

- **毎回実行する必要があります**（Anvil は毎回新しい状態で起動します）
- 既存のコントラクトアドレスが上書きされます（これは正常な動作です）

**デフォルト設定**:

- RPC URL: `http://localhost:8545`
- Chain ID: `31337`
- プライベートキー: Anvil のデフォルトアカウント（`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`）

### `backend/scripts/start-backend.sh`

**目的**: バックエンド API サーバーを起動するスクリプト（DynamoDB Local をリフレッシュして起動）

**機能**:

1. **DynamoDB Local のリフレッシュ**:

   - 既存の DynamoDB Local を停止してボリュームを削除
   - DynamoDB Local を再起動

2. **テーブルの作成**:

   - 必要な DynamoDB テーブルを自動作成

3. **PoC 用データの初期化**:

   - PoC 用企業データを自動初期化

4. **バックエンド API サーバーの起動**:
   - Express.js サーバーを起動

**使用方法**:

```bash
cd backend
bash scripts/start-backend.sh
```

**重要なポイント**:

- **毎回 DynamoDB Local をリフレッシュ**（データを削除）してから起動します
- テーブルは自動的に再作成されます

### トラブルシューティング

**Q: ポート 8545 が既に使用されているエラーが発生する**

A: 既に Anvil が起動している可能性があります。以下のコマンドでプロセスを確認し、必要に応じて停止してください：

```bash
lsof -i :8545
kill -9 <PID>
```

**Q: デプロイ済みのコントラクトアドレスが変わってしまった**

A: これは正常な動作です。Anvil は毎回新しい状態で起動するため、コントラクトアドレスも毎回変わります。`deploy-all.sh`を実行すると、`deployed.json`と`frontend/.env.local`が自動的に更新されます。

**Q: 毎回コントラクトをデプロイする必要があるのはなぜですか？**

A: このアプリケーションは毎回リフレッシュする前提で動作します。Anvil の状態は保持されないため、毎回コントラクトをデプロイする必要があります。

---

## 機能仕様

### 学生向け機能

#### 1. スタンプコレクション 🎫

- **機能**: 企業から発行されたスタンプを一覧表示
- **技術仕様**: ERC1155 準拠の SFT（Semi-Fungible Token）としてブロックチェーン上に記録
- **表示内容**: スタンプ名、企業名、カテゴリ、発行日時
- **カテゴリ**: finance（💰）、marketing（📊）、business（💼）、programming（💻）、design（🎨）、sales（📞）、consulting（💡）、hr（👥）、accounting（📈）、legal（⚖️）、engineering（🔧）、research（🔬）、education（📚）
- **データ取得**: ブロックチェーン（Anvil）から直接読み込み

#### 2. NFT 証明書 🏆

- **機能**: 取得した NFT 証明書を一覧表示・詳細確認
- **取得条件**: 同じ企業からスタンプを 3 つ集める
- **申請フロー**:
  - 学生側: 「NFT 証明書発行申請」ボタンで申請
  - 企業側: 申請一覧を確認し、承認後に NFT 発行画面へ遷移して発行
- **レアリティ**: Common、Rare、Epic、Legendary
- **データ取得**: ブロックチェーン（Anvil）から直接読み込み

#### 3. イベント応募 📅

- **機能**: 企業が作成したイベントに応募
- **応募内容**:
  - 応募動機・メッセージ
  - 経験・スキル
  - ZKP 証明データ（選択的開示）
- **ZKP 証明データ**:
  - 公開情報（開示）のみを企業側に表示
  - 非公開情報（秘匿）は表示されない
- **ステータス**: 審査中、承認済み、拒否

#### 4. 求人条件設定・検索 🔍

- **機能**: 希望する求人条件を設定し、マッチング企業を検索
- **設定項目**:
  - 仕事の種類（インターンシップ、正社員など）
  - 職種カテゴリ
  - 具体的な職種
  - 勤務地
  - 業界
  - 希望給与
  - 働き方（リモート、ハイブリッド、オフィス）
  - 希望スキル
  - 検証済み ZKP 証明の選択
- **マッチング条件**: 職種カテゴリが一致する企業を自動的にマッチング候補として表示

#### 5. マッチング企業一覧・詳細 🤝

- **機能**: マッチング条件に合った企業を一覧表示・詳細確認
- **表示内容**:
  - 企業情報
  - 採用条件
  - マッチングスコア
- **アクション**:
  - マッチングを作成（自動メッセージ送信）
  - メッセージを送る（企業アドレス自動入力）

#### 6. メッセージ機能 💬

- **機能**: 企業とのメッセージ交換
- **特徴**:
  - 会話管理（会話 ID によるグループ化）
  - 既読管理
  - 企業アドレスの自動入力（マッチング画面から遷移時）

#### 7. VC 管理・ZKP 生成・保存 🔐

- **機能**:
  - VC（Verifiable Credential）の管理（W3C 形式対応）
  - ゼロ知識証明（ZKP）の生成（TOEIC、学位証明に対応）
  - 選択的開示（必要な情報のみを開示）
  - 検証済み ZKP 証明の保存と選択
- **ZKP 生成**:
  - TOEIC 証明: スコア条件を満たすことを証明
  - 学位証明: GPA 条件を満たすこと、または学位証明書 VC の存在のみ証明
- **保存場所**:
  - 完全な証明データ: `frontend/src/data/zkp-proofs/`に JSON ファイルとして保存
  - 公開情報のみ: DynamoDB（`NonFungibleCareerZKPProofs`テーブル）に保存

### 企業向け機能

#### 1. スタンプ発行 🎫

- **機能**: 学生にスタンプを発行
- **技術仕様**: ERC1155 準拠の SFT（Semi-Fungible Token）としてブロックチェーン上に記録
- **発行内容**:
  - スタンプ名
  - 企業名（VC またはデータベースから自動取得）
  - カテゴリ（13 種類から選択）
  - 発行数量
- **データ保存**: ブロックチェーン（Anvil）上に記録

#### 2. NFT 証明書発行 🏆

- **機能**: 学生からの申請を承認し、NFT 証明書を発行
- **発行フロー**:
  1. 学生が「NFT 証明書発行申請」を送信
  2. 企業側で申請一覧を確認
  3. 申請を承認し、NFT 発行画面へ遷移
  4. スタンプ数（3 枚以上）を確認
  5. NFT 証明書を発行
- **発行内容**:
  - NFT 名
  - レアリティ（Common、Rare、Epic、Legendary）
  - 企業名
  - トークン URI
- **データ保存**: ブロックチェーン（Anvil）上に記録

#### 3. イベント作成・管理 📅

- **機能**: NFT 獲得イベントを作成・管理
- **作成内容**:
  - イベントタイトル
  - 説明
  - 開催期間
  - 開催場所
  - 最大参加者数
- **応募管理**:
  - 応募一覧の表示
  - 応募内容の確認（応募動機、経験・スキル、ZKP 証明データの公開情報）
  - 承認/拒否
  - 承認時にスタンプを自動発行

#### 4. 人材募集条件設定 📋

- **機能**: 採用条件を設定・保存
- **設定項目**:
  - 仕事の種類
  - 職種カテゴリ
  - 具体的な職種
  - 勤務地
  - 業界
  - 給与
  - 働き方
  - 必須スキル
  - 希望スキル
  - 説明

#### 5. 候補者検索 🔍

- **機能**: マッチング条件に合った候補者を検索
- **マッチング条件**: 職種カテゴリが一致する学生を自動的にマッチング候補として表示
- **表示内容**:
  - 候補者情報
  - 求人条件
  - マッチングスコア

#### 6. マッチング候補者一覧・詳細 🤝

- **機能**: 成立したマッチング一覧を表示・詳細確認
- **表示内容**:
  - 学生情報
  - 求人条件
  - スタンプ一覧
  - NFT 証明書一覧
  - ZKP 証明（証明ハッシュ、検証結果）
- **アクション**:
  - マッチングを作成（マッチング未作成の場合）
  - メッセージを送る（候補者アドレス自動入力）

#### 7. メッセージ機能 💬

- **機能**: 学生とのメッセージ交換
- **特徴**:
  - 会話管理（会話 ID によるグループ化）
  - 既読管理
  - 候補者アドレスの自動入力（マッチング画面から遷移時）

#### 8. VC 管理・企業名認証 🏢

- **機能**:
  - VC（Verifiable Credential）の管理
  - 企業名の認証とデータベースへの登録
  - ウォレットアドレスに紐づく企業名の自動取得
- **企業名の取得優先順位**:
  1. データベース（`NonFungibleCareerCompanies`テーブル）
  2. VC（`corporateRegistration`または`industryCertification`）
  3. モックマッピング（開発環境用）
- **データ保存**:
  - 企業情報: DynamoDB（`NonFungibleCareerCompanies`テーブル）
  - VC: ローカルストレージ（`orgVCs`）

---

## 技術仕様

### フロントエンド

- **フレームワーク**: React 19 + Vite
- **スタイリング**: Tailwind CSS
- **ルーティング**: React Router
- **ブロックチェーン連携**: Ethers.js v6
- **状態管理**: React Hooks（useState、useEffect、useCallback）
- **データキャッシュ**: ローカルストレージ

### バックエンド

- **フレームワーク**: Node.js + Express.js
- **データベース**: AWS DynamoDB（開発環境: DynamoDB Local）
- **認証**: ウォレットアドレスによる認証
- **API**: RESTful API

### ブロックチェーン

- **開発環境**: Foundry（Anvil）
- **言語**: Solidity 0.8.20
- **ネットワーク**: Anvil Local（Chain ID: 31337）
- **ライブラリ**: OpenZeppelin Contracts
- **コントラクト**:
  - `NonFungibleCareerNFT`（ERC721 準拠）
  - `StampManager`
  - `CareerStampSFT`（ERC1155 準拠）

### データストレージ

- **ブロックチェーン（Anvil）**:
  - スタンプデータ（ERC1155 準拠の SFT）
  - NFT 証明書データ（ERC721 準拠）
- **DynamoDB**:
  - イベントデータ
  - イベント応募データ
  - メッセージデータ
  - マッチングデータ
  - 求人/採用条件データ
  - ZKP 証明の公開情報
  - 企業情報
  - NFT 申請データ
- **ローカルストレージ（ブラウザ）**:
  - フロントエンドのキャッシュ
  - VC データ（`orgVCs`、`studentVCs`）
  - ZKP 証明の完全データ（`frontend/src/data/zkp-proofs/`）

---

## UI 遷移図

### 学生向け UI 遷移

```
/
└─> ユーザータイプ選択
    ├─> /student (学生)
    │   ├─> /student (ホーム)
    │   ├─> /student/mypage (マイページ)
    │   │   └─> NFT証明書発行申請
    │   ├─> /student/nfts (NFT一覧)
    │   │   └─> /student/nft/:id (NFT詳細)
    │   ├─> /student/settings (VC管理・ZKP)
    │   ├─> /student/events (イベント一覧)
    │   │   └─> /student/events/:id/apply (イベント応募)
    │   ├─> /student/applications (応募履歴)
    │   ├─> /student/job-conditions (求人条件設定)
    │   ├─> /student/job-search (求人検索)
    │   ├─> /student/matched-companies (マッチング企業一覧)
    │   │   └─> マッチング作成 → メッセージ画面（企業アドレス自動入力）
    │   └─> /student/messages (メッセージ)
    │
    └─> /org (企業)
        ├─> /org (ダッシュボード)
        ├─> /org/stamp-issuance (スタンプ発行)
        ├─> /org/nft-applications (NFT申請一覧)
        │   └─> /org/nft-issuance (NFT発行)
        ├─> /org/nfts (スタンプ/NFT一覧)
        │   └─> /org/nft/:id (NFT詳細)
        ├─> /org/events (イベント一覧)
        │   ├─> /org/events/create (イベント作成)
        │   └─> /org/events/:id/applications (応募一覧)
        ├─> /org/recruitment-conditions (人材募集条件設定)
        ├─> /org/candidate-search (候補者検索)
        ├─> /org/matched-candidates (マッチング候補者一覧)
        │   └─> マッチング作成/メッセージ送信（候補者アドレス自動入力）
        └─> /org/messages (メッセージ)
```

### 主要な画面遷移フロー

#### スタンプ獲得から NFT 取得まで

```
学生
  └─> イベント一覧 (/student/events)
      └─> イベント応募 (/student/events/:id/apply)
          └─> ZKP証明データを含む応募
              └─> 企業が承認
                  └─> スタンプ獲得（ブロックチェーンに記録）
                      └─> マイページ (/student/mypage)
                          └─> スタンプ3つでNFT交換可能
                              └─> NFT証明書発行申請
                                  └─> 企業側で承認・発行
                                      └─> NFT取得（ブロックチェーンに記録）
```

#### メッセージ交換フロー

```
学生/企業
  └─> メッセージ (/student/messages または /org/messages)
      └─> 新規会話開始（ウォレットアドレス入力、または自動入力）
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
          └─> 成立したマッチング一覧を確認 (/org/matched-candidates)
              └─> 候補者詳細を確認
                  └─> スタンプ・NFT・ZKP証明を確認
                      └─> マッチングを作成（未作成の場合）
                      └─> メッセージ送信（候補者アドレス自動入力）
```

---

## システム設計

### ブロックチェーン設計

#### ネットワーク設定

- **ネットワーク名**: Anvil Local
- **RPC URL**: `http://localhost:8545`
- **Chain ID**: `31337`
- **通貨記号**: `ETH`

#### スマートコントラクト

##### 1. NonFungibleCareerNFT.sol

**概要**: NFT 証明書を発行するコントラクト（ERC721 準拠）

**主要機能**:

- NFT 発行（`mint`関数）
- NFT 情報取得（`getTokenName`, `getTokenRarity`, `getTokenOrganizations`, `getTokenImageType`）
- 譲渡不可（`_update`関数で譲渡を制限）

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
function getTokenImageType(uint256 tokenId) public view returns (uint8)
```

##### 2. StampManager.sol

**概要**: スタンプを管理するコントラクト

**主要機能**:

- スタンプ発行（`issueStamp`関数）
- スタンプ一覧取得（`getUserStamps`関数）
- NFT 交換条件判定（`canMintNft`関数）
- 組織別スタンプ数取得（`getOrganizationStampCount`関数）
- カテゴリから画像タイプを決定（`_getImageTypeByCategory`関数）

**カテゴリと画像タイプのマッピング**:

- finance（💰）: 1
- marketing（📊）: 2
- business（💼）: 3
- programming（💻）: 4
- design（🎨）: 5
- sales（📞）: 6
- consulting（💡）: 7
- hr（👥）: 8
- accounting（📈）: 9
- legal（⚖️）: 10
- engineering（🔧）: 11
- research（🔬）: 12
- education（📚）: 13

**主要関数**:

```solidity
function issueStamp(
    address user,
    string memory name,
    string memory organization,
    string memory category,
    uint256 amount,
    uint8 imageType
) public onlyOwner returns (uint256)

function getUserStamps(address user) public view returns (uint256[] memory, uint256[] memory)
function canMintNft(address user, string memory organization) public view returns (bool)
function getOrganizationStampCount(address user, string memory organization) public view returns (uint256)
```

##### 3. CareerStampSFT.sol

**概要**: スタンプを発行する SFT（Semi-Fungible Token）コントラクト（ERC1155 準拠）

**主要機能**:

- スタンプ発行（`StampManager`経由で呼び出し）
- スタンプ一覧取得

#### コントラクト間の関係

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

### データベース設計

#### データストレージの構成

```
┌─────────────────────────────────────────┐
│         DynamoDB (DynamoDB Local)      │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Events テーブル                │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  EventApplications テーブル      │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Messages テーブル              │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Matches テーブル               │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  JobConditions テーブル          │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  RecruitmentConditions テーブル │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  ZKPProofs テーブル             │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Companies テーブル             │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  NFTApplications テーブル       │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         │
┌────────▼─────────────────────────────────┐
│   ブロックチェーン (Anvil)               │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  StampManager コントラクト       │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  NonFungibleCareerNFT コントラクト│ │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**設計方針**:

- **ブロックチェーン**: スタンプと NFT 証明書のデータ（改ざん不可能な重要なデータ）
- **DynamoDB**: イベント、応募、メッセージ、マッチング、求人/採用条件、ZKP 証明の公開情報、企業情報、NFT 申請のデータ（頻繁に更新されるデータ）

#### 主要テーブル

##### 1. イベントテーブル (`NonFungibleCareerEvents`)

- **プライマリキー**: `eventId` (String)
- **GSI**: `OrgIndex` - `orgWalletAddress` で検索
- **主要フィールド**: `eventId`, `orgWalletAddress`, `title`, `description`, `startDate`, `endDate`, `location`, `maxParticipants`, `status`, `createdAt`, `updatedAt`

##### 2. イベント応募テーブル (`NonFungibleCareerEventApplications`)

- **プライマリキー**: `applicationId` (String)
- **GSI**: `EventIndex` - `eventId` で検索、`WalletIndex` - `walletAddress` で検索
- **主要フィールド**: `applicationId`, `eventId`, `walletAddress`, `applicationText`, `appliedAt`, `status`

##### 3. メッセージテーブル (`NonFungibleCareerMessages`)

- **プライマリキー**: `messageId` (String)
- **GSI**: `ConversationIndex` - `conversationId` で検索、`SenderIndex` - `senderAddress` で検索
- **主要フィールド**: `messageId`, `conversationId`, `senderAddress`, `receiverAddress`, `content`, `sentAt`, `read`

##### 4. マッチングテーブル (`NonFungibleCareerMatches`)

- **プライマリキー**: `matchId` (String)
- **GSI**: `StudentIndex` - `studentAddress` で検索、`OrgIndex` - `orgAddress` で検索
- **主要フィールド**: `matchId`, `studentAddress`, `orgAddress`, `zkpProofHash`, `matchedAt`, `status`

##### 5. 求人条件テーブル (`NonFungibleCareerJobConditions`)

- **プライマリキー**: `walletAddress` (String)
- **主要フィールド**: `walletAddress`, `jobType`, `positionCategory`, `position`, `location`, `industry`, `salary`, `workStyle`, `skills`, `selectedZKPProofs`, `createdAt`, `updatedAt`

##### 6. 採用条件テーブル (`NonFungibleCareerRecruitmentConditions`)

- **プライマリキー**: `orgAddress` (String)
- **主要フィールド**: `orgAddress`, `jobType`, `positionCategory`, `position`, `location`, `industry`, `salary`, `workStyle`, `requiredSkills`, `preferredSkills`, `description`, `createdAt`, `updatedAt`

##### 7. ZKP 証明テーブル (`NonFungibleCareerZKPProofs`)

- **プライマリキー**: `proofId` (String)
- **GSI**: `WalletIndex` - `walletAddress` で検索
- **主要フィールド**: `proofId`, `walletAddress`, `proofHash`, `publicInputs`, `usedVCs`, `satisfiedConditions`, `verified`, `verifiedAt`

##### 8. 企業テーブル (`NonFungibleCareerCompanies`)

- **プライマリキー**: `walletAddress` (String)
- **主要フィールド**: `walletAddress`, `companyName`, `status`, `createdAt`, `updatedAt`

##### 9. NFT 申請テーブル (`NonFungibleCareerNFTApplications`)

- **プライマリキー**: `applicationId` (String)
- **GSI**: `UserWalletAddressIndex` - `userWalletAddress` で検索、`OrgWalletAddressIndex` - `orgWalletAddress` で検索
- **主要フィールド**: `applicationId`, `userWalletAddress`, `orgWalletAddress`, `nftName`, `rarity`, `organization`, `status`, `appliedAt`, `updatedAt`

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
│  │  Company Routes                 │  │
│  │  NFTApplication Routes          │  │
│  └─────────────────────────────────┘  │
│                │                        │
│         ┌─────▼─────┐                  │
│         │ DynamoDB   │                  │
│         │  Local     │                  │
│         └────────────┘                  │
└─────────────────────────────────────────┘
```

### 技術スタック

詳細は[技術仕様](#技術仕様)セクションを参照してください。

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

# バックエンド起動スクリプトを使用（推奨：毎回リセットして起動）
bash scripts/start-backend.sh
```

または、手動で再起動する場合：

```bash
cd backend
# Dockerが起動しているか確認
docker ps

# DynamoDB Localを停止してボリュームを削除（データをリセット）
docker compose down -v

# DynamoDB Localを再起動
npm run dynamodb:up

# 数秒待ってからテーブルを作成
sleep 5
npm run create-api-tables
npm run create-companies-table
npm run init-poc-companies

# バックエンドAPIサーバーを起動
npm run dev
```

### バックエンド API に接続できない場合

```bash
cd backend

# バックエンド起動スクリプトを使用（推奨：毎回リセットして起動）
bash scripts/start-backend.sh
```

または、手動で再起動する場合：

```bash
cd backend
# DynamoDB Localをリセット
docker compose down -v
npm run dynamodb:up
sleep 5

# テーブルを作成
npm run create-api-tables
npm run create-companies-table
npm run init-poc-companies

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

### マッチング情報が見つからない場合

- マッチングがまだ作成されていない可能性があります
- 学生側から「マッチングを作成」ボタンを押すか、企業側から「マッチングを作成」ボタンを押してください
- コンソールログ（`[OrgMatchedCandidates]`で始まるログ）を確認して、原因を特定してください

### NFT やスタンプが表示されない場合

**注意**: このアプリケーションは毎回リフレッシュする前提で動作します。Anvil を再起動すると、以前発行した NFT やスタンプは失われます。

#### 原因 1: コントラクトがデプロイされていない

**問題**: Anvil は起動しているが、コントラクトがデプロイされていない。

**対処法**:

```bash
cd contracts
bash scripts/deploy-all.sh
```

#### 原因 2: コントラクトアドレスの不一致

**問題**: `deployed.json`と`frontend/.env.local`のアドレスが一致していない。

**対処法**:

```bash
cd contracts
bash scripts/generate-env.sh
# フロントエンドを再起動
```

#### 原因 3: ウォレットアドレスの不一致

**問題**: 別のウォレットアドレスで発行したデータを参照している。

**対処法**:

1. MetaMask で正しいアカウントが選択されているか確認
2. Anvil 起動時に表示されるプライベートキーと、MetaMask でインポートしたアカウントが一致しているか確認

#### 推奨される診断手順

1. **コントラクトアドレスの整合性を確認**:

   ```bash
   cd contracts
   cat deployed.json
   cat ../frontend/.env.local
   ```

2. **フロントエンドのコンソールログを確認**:

   - ブラウザの開発者ツール（F12）を開く
   - Console タブでエラーメッセージを確認
   - `[Home]`や`[MyPage]`で始まるログを確認

3. **Anvil のログを確認**:
   - Anvil を起動しているターミナルでエラーメッセージを確認

---

---

**最終更新**: 2025 年 12 月 17 日
