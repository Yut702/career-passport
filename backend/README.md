# CareerPassport Backend

企業/組織向けバックエンドAPI

## 前提条件

- Node.js v18以上
- pnpm（または npm）
- Docker（DynamoDB Local用）

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd backend
pnpm install
```

### 2. 環境変数の設定

`.env` ファイルを作成（または既存のものを確認）:

```bash
cp .env.example .env  # .env.exampleがある場合
```

必要な環境変数:
```
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=ap-northeast-1
DYNAMODB_TABLE_USERS=CareerPassportUsers
DYNAMODB_TABLE_EVENTS=CareerPassportEvents
DYNAMODB_TABLE_STAMPS=CareerPassportStamps
JWT_SECRET=dev-secret-change-me
```

### 3. DynamoDB Local の起動

```bash
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local
```

既存のコンテナがある場合:
```bash
docker start dynamodb-local
```

### 4. テーブル作成とシードデータ投入

```bash
npm run create-table
npm run seed
```

### 5. サーバー起動

```bash
pnpm run start
# または
npm run start
```

サーバーは `http://localhost:3000` で起動します。

## API エンドポイント

### 認証

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/org/register` | 組織アカウント登録 |
| POST | `/api/org/login` | 組織ログイン |
| GET | `/api/org/me` | ログイン中の組織情報取得（要認証） |

### ダッシュボード

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/org/dashboard` | 組織ダッシュボード情報取得（要認証） |

## テストアカウント

シードデータ投入後に使用可能:

- **Email**: `org@example.com`
- **Password**: `password123`

## 動作確認（curl）

```bash
# 1. ログインしてトークン取得
TOKEN=$(curl -s -X POST http://localhost:3000/api/org/login \
  -H "Content-Type: application/json" \
  -d '{"email":"org@example.com","password":"password123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 2. ダッシュボードAPI呼び出し
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/org/dashboard | python3 -m json.tool
```

## ダッシュボードAPIレスポンス例

```json
{
  "orgId": "org@example.com",
  "summary": {
    "totalStamps": 7,
    "totalParticipants": 5,
    "totalNfts": 0
  },
  "events": [
    {
      "eventId": "event-001",
      "title": "キャリアセミナー2024",
      "participantCount": 3,
      "stampCount": 3,
      "satisfactionScore": 4.5
    },
    {
      "eventId": "event-002",
      "title": "インターンシップ説明会",
      "participantCount": 2,
      "stampCount": 2,
      "satisfactionScore": 4.2
    },
    {
      "eventId": "event-003",
      "title": "業界研究ワークショップ",
      "participantCount": 2,
      "stampCount": 2,
      "satisfactionScore": null
    }
  ]
}
```

## シードデータ内容

### ユーザー（組織）
| Email | Password | Name | Role |
|-------|----------|------|------|
| org@example.com | password123 | Org Admin | org |

### イベント
| ID | タイトル | 満足度 |
|----|----------|--------|
| event-001 | キャリアセミナー2024 | 4.5 |
| event-002 | インターンシップ説明会 | 4.2 |
| event-003 | 業界研究ワークショップ | - |

### スタンプ（参加記録）
| イベント | 参加学生 |
|----------|----------|
| event-001 | student1, student2, student3 |
| event-002 | student1, student4 |
| event-003 | student2, student5 |
