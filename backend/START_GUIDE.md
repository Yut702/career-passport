# バックエンド API 起動手順書

## 一から起動する手順

### ステップ 1: DynamoDB Local の起動（Docker）

```bash
cd /Users/hiramac/career-passport/backend
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

### ステップ 2: テーブルの作成

```bash
cd /Users/hiramac/career-passport/backend
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

### ステップ 3: 環境変数の確認

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
cd /Users/hiramac/career-passport/backend
cat .env
```

### ステップ 4: バックエンドサーバーの起動

```bash
cd /Users/hiramac/career-passport/backend
npm run dev
```

**期待される出力**:

```
> backend@1.0.0 dev
> nodemon src/server.js

[nodemon] starting `node src/server.js`
Backend running on 3000
```

### ステップ 5: API 動作確認

**新しいターミナル**を開いて、以下を実行：

#### 5-1. イベント応募 API のテスト

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

#### 5-2. メッセージ API のテスト

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

#### 5-3. マッチング API のテスト

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

### テストスクリプトの実行

```bash
cd /Users/hiramac/career-passport/backend
bash test-api.sh
```
