# バックエンド API ガイド

このガイドでは、バックエンド API の起動手順とテスト方法を説明します。

## 目次

1. [起動手順](#起動手順)
2. [テスト手順](#テスト手順)
3. [トラブルシューティング](#トラブルシューティング)
4. [クイックリファレンス](#クイックリファレンス)

---

## 起動手順

### 一から起動する手順

#### ステップ 1: DynamoDB Local の起動（Docker）

```bash
cd backend
npm run dynamodb:up
```

**確認**:

```bash
# コンテナが起動しているか確認
docker compose ps

# DynamoDB Localに接続できるか確認
curl http://localhost:8000
```

**期待される出力**:

```
NAME             IMAGE                          COMMAND                   SERVICE    CREATED         STATUS         PORTS
dynamodb-local   amazon/dynamodb-local:latest   "java -jar DynamoDBL…"   dynamodb   X minutes ago   Up X minutes   0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp
```

#### ステップ 2: テーブルの作成

```bash
cd backend
npm run create-api-tables
```

**期待される出力**:

```
=== DynamoDB テーブル作成開始 ===

接続先: http://localhost:8000

📝 テーブル作成中: NonFungibleCareerEventApplications...
✅ 作成完了: NonFungibleCareerEventApplications

📝 テーブル作成中: NonFungibleCareerMessages...
✅ 作成完了: NonFungibleCareerMessages

📝 テーブル作成中: NonFungibleCareerMatches...
✅ 作成完了: NonFungibleCareerMatches

=== テーブル作成完了 ===
```

#### ステップ 3: 環境変数の確認

`backend/.env`ファイルが存在し、以下の内容が設定されていることを確認：

```env
AWS_REGION=ap-northeast-1
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_USERS=NonFungibleCareerUsers
JWT_SECRET=your-secret-key
PORT=3000
```

**確認コマンド**:

```bash
cd backend
cat .env
```

#### ステップ 4: バックエンドサーバーの起動

```bash
cd backend
npm run dev
```

**期待される出力**:

```
> backend@1.0.0 dev
> nodemon src/server.js

[nodemon] starting `node src/server.js`
Backend running on 3000
```

#### ステップ 5: API 動作確認

**新しいターミナル**を開いて、以下を実行：

##### 5-1. イベント応募 API のテスト

```bash
# イベントに応募
curl -X POST http://localhost:3000/api/events/event-123/apply \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "applicationText": "応募動機です"
  }'
```

**期待される出力**:

```json
{
  "ok": true,
  "application": {
    "applicationId": "...",
    "eventId": "event-123",
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "applicationText": "応募動機です",
    "appliedAt": "2025-12-11T...",
    "status": "pending"
  }
}
```

```bash
# 応募一覧を取得
curl "http://localhost:3000/api/events/applications?walletAddress=0x1111111111111111111111111111111111111111"
```

##### 5-2. メッセージ API のテスト

```bash
# メッセージを送信
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0x1111111111111111111111111111111111111111",
    "receiverAddress": "0x2222222222222222222222222222222222222222",
    "content": "こんにちは"
  }'
```

```bash
# 会話一覧を取得
curl "http://localhost:3000/api/messages/conversations?walletAddress=0x1111111111111111111111111111111111111111"
```

##### 5-3. マッチング API のテスト

```bash
# マッチングを作成
curl -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -d '{
    "studentAddress": "0x1111111111111111111111111111111111111111",
    "orgAddress": "0x2222222222222222222222222222222222222222"
  }'
```

```bash
# マッチング一覧を取得
curl "http://localhost:3000/api/matches/student?walletAddress=0x1111111111111111111111111111111111111111"
```

---

## テスト手順

### 前提条件の確認

#### 1. DynamoDB Local の起動確認

```bash
cd backend
docker compose ps
```

**期待される出力**:

```
NAME             IMAGE                          STATUS
dynamodb-local   amazon/dynamodb-local:latest   Up X minutes
```

#### 2. テーブルの作成確認

```bash
cd backend
npm run create-api-tables
```

#### 3. バックエンドサーバーの起動確認

```bash
cd backend
npm run dev
```

**期待される出力**:

```
Backend running on 3000
```

### フロントエンドからのテスト手順

#### 1. フロントエンドの起動

```bash
cd frontend
npm run dev
```

#### 2. ブラウザでテスト

1. `http://localhost:5173` を開く
2. MetaMask でウォレットを接続
3. 学生としてログイン

#### 3. イベント応募のテスト

##### 手順

1. **イベント一覧ページ** (`/student/events`) に移動
2. 任意のイベントの「応募する」ボタンをクリック
3. **応募フォーム** (`/student/events/:id/apply`) で以下を入力：
   - 応募動機（必須）
   - 経験・スキル（任意）
4. 「応募する」ボタンをクリック

##### 確認ポイント

✅ **成功時の表示**:

- 緑色の成功メッセージが表示される
- 応募 ID が表示される
- ページ下部に「このイベントへの応募履歴」セクションが表示される
- 応募履歴に応募内容、ステータス（審査中）、応募日時が表示される

✅ **ブラウザのコンソールで確認**:

- `📤 応募送信:` のログが表示される
- `✅ 応募成功:` のログが表示される

❌ **エラー時の表示**:

- 赤色のエラーメッセージが表示される
- ブラウザのコンソールに `❌ 応募エラー:` のログが表示される

##### 応募履歴の確認

応募後、同じページの下部に「📋 このイベントへの応募履歴」セクションが表示されます：

- **応募 ID**: 応募を識別する ID
- **ステータス**: 審査中 / 承認済み / 却下
- **応募日時**: 応募した日時
- **応募内容**: クリックで展開して確認可能

#### 4. メッセージ機能のテスト

##### 手順 1: 新しい会話を開始

1. **メッセージページ** (`/student/messages`) に移動
2. 左側の「+ 新しい会話を開始」ボタンをクリック
3. 企業のウォレットアドレスを入力（例: `0x2222222222222222222222222222222222222222`）
4. 「会話を開始」ボタンをクリック

##### 手順 2: メッセージを送信

1. メッセージ入力欄にメッセージを入力
2. 「送信」ボタンをクリック（または Enter キー）

##### 確認ポイント

✅ **成功時の動作**:

- メッセージが即座に画面に表示される
- ブラウザのコンソールに `📤 メッセージ送信:` のログが表示される
- ブラウザのコンソールに `✅ メッセージ送信成功:` のログが表示される
- 5 秒ごとにメッセージ一覧が自動更新される

✅ **会話一覧の表示**:

- 左側の会話一覧に新しい会話が表示される
- 最新メッセージのプレビューが表示される
- 未読数が表示される（ある場合）

❌ **エラー時の表示**:

- 赤色のエラーメッセージが表示される
- ブラウザのコンソールにエラーログが表示される

##### 注意点

- **会話がない場合**: 「+ 新しい会話を開始」ボタンから企業アドレスを入力して会話を開始できます
- **企業が選択されていない場合**: メッセージ入力欄が無効化され、警告メッセージが表示されます
- **ウォレット未接続**: ウォレットを接続する必要があります

#### 5. マッチング機能のテスト

1. **マッチング企業一覧** (`/student/matched-companies`) に移動
2. マッチング企業の一覧が表示されることを確認

### API 直接テスト（curl コマンド）

#### テスト 1: イベント応募 API

**新しいターミナル**を開いて実行：

```bash
curl -X POST "http://localhost:3000/api/events/event-123/apply" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x1111111111111111111111111111111111111111","applicationText":"応募動機です"}'
```

**期待される出力**:

```json
{
  "ok": true,
  "application": {
    "applicationId": "...",
    "eventId": "event-123",
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "applicationText": "応募動機です",
    "appliedAt": "2025-12-11T...",
    "status": "pending"
  }
}
```

#### テスト 2: 応募一覧取得

```bash
curl "http://localhost:3000/api/events/applications?walletAddress=0x1111111111111111111111111111111111111111"
```

**期待される出力**:

```json
{
  "ok": true,
  "applications": [
    {
      "applicationId": "...",
      "eventId": "event-123",
      ...
    }
  ]
}
```

#### テスト 3: メッセージ送信

```bash
curl -X POST "http://localhost:3000/api/messages" \
  -H "Content-Type: application/json" \
  -d '{"senderAddress":"0x1111111111111111111111111111111111111111","receiverAddress":"0x2222222222222222222222222222222222222222","content":"こんにちは"}'
```

**期待される出力**:

```json
{
  "ok": true,
  "message": {
    "messageId": "...",
    "conversationId": "...",
    "senderAddress": "0x1111111111111111111111111111111111111111",
    "receiverAddress": "0x2222222222222222222222222222222222222222",
    "content": "こんにちは",
    "sentAt": "2025-12-11T...",
    "read": false
  }
}
```

#### テスト 4: 会話一覧取得

```bash
curl "http://localhost:3000/api/messages/conversations?walletAddress=0x1111111111111111111111111111111111111111"
```

#### テスト 5: マッチング作成

```bash
curl -X POST "http://localhost:3000/api/matches" \
  -H "Content-Type: application/json" \
  -d '{"studentAddress":"0x1111111111111111111111111111111111111111","orgAddress":"0x2222222222222222222222222222222222222222"}'
```

#### テスト 6: マッチング一覧取得

```bash
curl "http://localhost:3000/api/matches/student?walletAddress=0x1111111111111111111111111111111111111111"
```

### テストスクリプトの実行

```bash
cd backend
bash test-api.sh
```

### テスト結果の確認ポイント

✅ **成功の確認**:

- HTTP ステータスコードが 200 または 201
- レスポンスに`"ok": true`が含まれる
- データが正しく保存されている（DynamoDB で確認）
- フロントエンドで正しく表示される
- ブラウザのコンソールにエラーがない

❌ **失敗の確認**:

- HTTP ステータスコードが 400, 404, 500 など
- エラーメッセージが表示される
- サーバーログにエラーが記録される
- ブラウザのコンソールにエラーが表示される

---

## トラブルシューティング

### DynamoDB Local が起動しない

```bash
# コンテナの状態を確認
docker compose ps

# ログを確認
docker compose logs dynamodb

# 再起動
docker compose down
docker compose up -d
```

### ポート 3000 が使用中

```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# プロセスを停止（必要に応じて）
kill -9 <PID>
```

### テーブルが作成されない

```bash
# DynamoDB Localに接続できるか確認
curl http://localhost:8000

# 環境変数を確認
cat .env | grep DYNAMODB_ENDPOINT

# テーブル一覧を確認
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region ap-northeast-1
```

### API が応答しない

```bash
# サーバーが起動しているか確認
ps aux | grep "node.*server.js"

# サーバーのログを確認
# サーバーを起動しているターミナルでエラーメッセージを確認
```

### エラー: "Cannot connect to server"

**原因**: バックエンドサーバーが起動していない

**解決方法**:

```bash
cd backend
npm run dev
```

### エラー: "Table does not exist"

**原因**: DynamoDB テーブルが作成されていない

**解決方法**:

```bash
cd backend
npm run create-api-tables
```

### エラー: "DynamoDB connection failed"

**原因**: DynamoDB Local が起動していない

**解決方法**:

```bash
cd backend
npm run dynamodb:up
```

### CORS エラー

**原因**: フロントエンドとバックエンドのポートが異なる

**確認**: `backend/src/server.js`で CORS が有効になっているか確認

```javascript
app.use(cors());
```

### メッセージが送信できない

**原因 1**: 企業が選択されていない

**解決方法**:

- 左側の会話一覧から企業を選択する
- または「+ 新しい会話を開始」から企業アドレスを入力して会話を開始する

**原因 2**: ウォレットが接続されていない

**解決方法**: MetaMask でウォレットを接続する

### 応募が反映されない

**確認方法**:

1. ブラウザのコンソール（F12）を開く
2. 応募ボタンをクリック
3. `📤 応募送信:` と `✅ 応募成功:` のログが表示されるか確認
4. ページ下部の「応募履歴」セクションに応募が表示されるか確認

**解決方法**:

- バックエンドサーバーが起動しているか確認
- DynamoDB Local が起動しているか確認
- テーブルが作成されているか確認

---

## クイックリファレンス

### よく使うコマンド

```bash
# DynamoDB Localの起動
npm run dynamodb:up

# DynamoDB Localの停止
npm run dynamodb:down

# DynamoDB Localのログ確認
npm run dynamodb:logs

# テーブル作成
npm run create-api-tables

# バックエンドサーバー起動
npm run dev
```

### テーブル作成スクリプトの使い分け

- **`create-table.js`**: ユーザーテーブル（`NonFungibleCareerUsers`）を作成
- **`create-tables.js`**: スタンプ・NFT テーブル（`NonFungibleCareerStamps`, `NonFungibleCareerNFTs`）を作成
- **`create-api-tables.js`**: API 用テーブル（`NonFungibleCareerEventApplications`, `NonFungibleCareerMessages`, `NonFungibleCareerMatches`）を作成

### ポート番号

- **バックエンド API**: `3000`
- **DynamoDB Local**: `8000`
- **フロントエンド**: `5173`
