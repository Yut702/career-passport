# Day 7: バックエンド API 実装 - 詳細手順書

## 目次

1. [前提条件の確認](#1-前提条件の確認)
2. [データベース設計（DynamoDB）](#2-データベース設計dynamodb)
3. [イベント応募 API の実装](#3-イベント応募-api-の実装)
4. [メッセージ API の実装](#4-メッセージ-api-の実装)
5. [マッチング API の実装](#5-マッチング-api-の実装)
6. [フロントエンドとの統合](#6-フロントエンドとの統合)
7. [動作確認とテスト](#7-動作確認とテスト)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. 前提条件の確認

### 1.1 Day 6 の完了確認

Day 7 を開始する前に、Day 6 の作業が完了していることを確認します：

**確認項目**:

- ✅ 全ページのブロックチェーン連携が完了している
- ✅ ローカルストレージとブロックチェーンの同期機能が実装されている
- ✅ エラーハンドリングとローディング状態の表示が改善されている
- ✅ トランザクション状態の可視化が実装されている

**確認コマンド**:

```bash
# フロントエンドのディレクトリ構造を確認
cd frontend/src
ls -la pages/
ls -la hooks/
ls -la lib/
```

**期待されるファイル**:

- `pages/Home.jsx`
- `pages/MyNFTs.jsx`
- `pages/OrgDashboard.jsx`
- `pages/NFTDetail.jsx`
- `hooks/useSync.js`
- `lib/sync.js`
- `components/Loading.jsx`
- `components/Skeleton.jsx`
- `components/TransactionStatus.jsx`

### 1.2 バックエンド環境の確認

バックエンドの基本構造が整っていることを確認します：

```bash
cd backend
ls -la src/
```

**期待されるディレクトリ構造**:

```
backend/
├── src/
│   ├── server.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── orgRoutes.js
│   │   ├── stampRoutes.js
│   │   └── nftRoutes.js
│   ├── lib/
│   │   ├── dynamo.js
│   │   └── dynamo-stamps.js
│   └── models/
│       └── userModel.js
├── scripts/
│   ├── create-table.js
│   └── create-tables.js
└── package.json
```

### 1.3 DynamoDB のセットアップ確認（Docker）

Docker を使用して DynamoDB Local を起動します：

**Docker のインストール確認**:

```bash
# Docker がインストールされているか確認
docker --version
docker compose version
```

**DynamoDB Local の起動**:

```bash
cd backend
npm run dynamodb:up
```

**DynamoDB Local の停止**:

```bash
cd backend
npm run dynamodb:down
```

**DynamoDB Local のログ確認**:

```bash
cd backend
npm run dynamodb:logs
```

**動作確認**:

```bash
# DynamoDB Local が起動しているか確認
curl http://localhost:8000
```

### 1.4 環境変数の確認

バックエンドの環境変数が設定されていることを確認します：

```bash
cd backend
cat .env
```

**期待される環境変数**:

```env
# DynamoDB 設定（Docker で起動した DynamoDB Local を使用）
AWS_REGION=ap-northeast-1
DYNAMODB_ENDPOINT=http://localhost:8000
# 注意: Docker で DynamoDB Local を使用する場合、DYNAMODB_ENDPOINT を設定します
# AWS 認証情報は不要（DynamoDB Local は認証不要）

# DynamoDB テーブル名
DYNAMODB_TABLE_USERS=NonFungibleCareerUsers

# JWT 設定
JWT_SECRET=your-secret-key-change-in-production

# サーバー設定
PORT=3000
```

**注意**:

- Docker で DynamoDB Local を使用する場合、`DYNAMODB_ENDPOINT=http://localhost:8000` を設定します
- AWS 認証情報（`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`）は不要です
- 本番環境で AWS DynamoDB を使用する場合は、`DYNAMODB_ENDPOINT` を削除し、AWS 認証情報を設定します

---

## 2. データベース設計（DynamoDB）

### 2.1 Web3 設計の原則

**重要**: このプロジェクトは Web3 設計を採用しており、**個人情報（名前、メールアドレス、生年月日など）を運営側のデータベースに保存しません**。

**保存するデータ**:

- ウォレットアドレス（唯一の識別子）
- メタデータ（イベント ID、タイムスタンプなど）
- メッセージ内容（テキスト、個人情報ではない）
- ZKP 証明のハッシュ（検証用）

**保存しないデータ**:

- 名前、メールアドレス、生年月日、住所、電話番号
- VC の詳細内容（ローカルストレージのみ）
- 求人条件の詳細（ローカルストレージのみ）

### 2.2 テーブル設計

以下のテーブルを作成します：

#### 2.2.1 イベント応募テーブル（`NonFungibleCareerEventApplications`）

**スキーマ**:

```javascript
{
  TableName: "NonFungibleCareerEventApplications",
  KeySchema: [
    { AttributeName: "applicationId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "applicationId", AttributeType: "S" },
    { AttributeName: "eventId", AttributeType: "S" },
    { AttributeName: "walletAddress", AttributeType: "S" }
  ],
  BillingMode: "PAY_PER_REQUEST",
  GlobalSecondaryIndexes: [
    {
      IndexName: "EventIndex",
      KeySchema: [{ AttributeName: "eventId", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" }
    },
    {
      IndexName: "WalletIndex",
      KeySchema: [{ AttributeName: "walletAddress", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" }
    }
  ]
}
```

**データ項目**:

- `applicationId` (String): 応募 ID（UUID）
- `eventId` (String): イベント ID
- `walletAddress` (String): 応募者のウォレットアドレス
- `applicationText` (String): 応募動機（テキスト、個人情報ではない）
- `appliedAt` (String): 応募日時（ISO 8601）
- `status` (String): 応募ステータス（"pending", "approved", "rejected"）

#### 2.2.2 メッセージテーブル（`NonFungibleCareerMessages`）

**スキーマ**:

```javascript
{
  TableName: "NonFungibleCareerMessages",
  KeySchema: [
    { AttributeName: "messageId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "messageId", AttributeType: "S" },
    { AttributeName: "conversationId", AttributeType: "S" },
    { AttributeName: "senderAddress", AttributeType: "S" }
  ],
  BillingMode: "PAY_PER_REQUEST",
  GlobalSecondaryIndexes: [
    {
      IndexName: "ConversationIndex",
      KeySchema: [{ AttributeName: "conversationId", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" }
    },
    {
      IndexName: "SenderIndex",
      KeySchema: [{ AttributeName: "senderAddress", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" }
    }
  ]
}
```

**データ項目**:

- `messageId` (String): メッセージ ID（UUID）
- `conversationId` (String): 会話 ID（送信者アドレス + 受信者アドレスのソート済み結合）
- `senderAddress` (String): 送信者のウォレットアドレス
- `receiverAddress` (String): 受信者のウォレットアドレス
- `content` (String): メッセージ内容（テキスト、個人情報ではない）
- `sentAt` (String): 送信日時（ISO 8601）
- `read` (Boolean): 既読フラグ

#### 2.2.3 マッチングテーブル（`NonFungibleCareerMatches`）

**スキーマ**:

```javascript
{
  TableName: "NonFungibleCareerMatches",
  KeySchema: [
    { AttributeName: "matchId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "matchId", AttributeType: "S" },
    { AttributeName: "studentAddress", AttributeType: "S" },
    { AttributeName: "orgAddress", AttributeType: "S" }
  ],
  BillingMode: "PAY_PER_REQUEST",
  GlobalSecondaryIndexes: [
    {
      IndexName: "StudentIndex",
      KeySchema: [{ AttributeName: "studentAddress", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" }
    },
    {
      IndexName: "OrgIndex",
      KeySchema: [{ AttributeName: "orgAddress", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" }
    }
  ]
}
```

**データ項目**:

- `matchId` (String): マッチング ID（UUID）
- `studentAddress` (String): 学生のウォレットアドレス
- `orgAddress` (String): 企業のウォレットアドレス
- `zkpProofHash` (String): ZKP 証明のハッシュ（検証用、オプション）
- `matchedAt` (String): マッチング日時（ISO 8601）
- `status` (String): マッチングステータス（"active", "closed"）

### 2.3 テーブル作成スクリプトの実装

**ファイル**: `backend/scripts/create-api-tables.js`

```javascript
import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB(config);

const tables = [
  {
    TableName: "NonFungibleCareerEventApplications",
    KeySchema: [{ AttributeName: "applicationId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "applicationId", AttributeType: "S" },
      { AttributeName: "eventId", AttributeType: "S" },
      { AttributeName: "walletAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "EventIndex",
        KeySchema: [{ AttributeName: "eventId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "WalletIndex",
        KeySchema: [{ AttributeName: "walletAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  {
    TableName: "NonFungibleCareerMessages",
    KeySchema: [{ AttributeName: "messageId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "messageId", AttributeType: "S" },
      { AttributeName: "conversationId", AttributeType: "S" },
      { AttributeName: "senderAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "ConversationIndex",
        KeySchema: [{ AttributeName: "conversationId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "SenderIndex",
        KeySchema: [{ AttributeName: "senderAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  {
    TableName: "NonFungibleCareerMatches",
    KeySchema: [{ AttributeName: "matchId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "matchId", AttributeType: "S" },
      { AttributeName: "studentAddress", AttributeType: "S" },
      { AttributeName: "orgAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "StudentIndex",
        KeySchema: [{ AttributeName: "studentAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "OrgIndex",
        KeySchema: [{ AttributeName: "orgAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
];

async function createTables() {
  for (const table of tables) {
    try {
      await dynamoDB.createTable(table).promise();
      console.log(`✅ Created table: ${table.TableName}`);
    } catch (err) {
      if (err.code === "ResourceInUseException") {
        console.log(`⚠️  Table already exists: ${table.TableName}`);
      } else {
        console.error(`❌ Error creating ${table.TableName}:`, err);
      }
    }
  }
}

createTables();
```

**実行コマンド**:

```bash
cd backend
node scripts/create-api-tables.js
```

---

## 3. イベント応募 API の実装

### 3.1 DynamoDB ユーティリティの作成

**ファイル**: `backend/src/lib/dynamo-events.js`

```javascript
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);
const TABLE = "NonFungibleCareerEventApplications";

/**
 * イベント応募を作成
 */
export async function createApplication(data) {
  const applicationId = uuidv4();
  const application = {
    applicationId,
    eventId: data.eventId,
    walletAddress: data.walletAddress.toLowerCase(),
    applicationText: data.applicationText || "",
    appliedAt: new Date().toISOString(),
    status: "pending",
  };

  await dynamoDB
    .put({
      TableName: TABLE,
      Item: application,
    })
    .promise();

  return application;
}

/**
 * イベント ID で応募一覧を取得
 */
export async function getApplicationsByEvent(eventId) {
  const result = await dynamoDB
    .query({
      TableName: TABLE,
      IndexName: "EventIndex",
      KeyConditionExpression: "eventId = :eventId",
      ExpressionAttributeValues: {
        ":eventId": eventId,
      },
    })
    .promise();

  return result.Items || [];
}

/**
 * ウォレットアドレスで応募一覧を取得
 */
export async function getApplicationsByWallet(walletAddress) {
  const result = await dynamoDB
    .query({
      TableName: TABLE,
      IndexName: "WalletIndex",
      KeyConditionExpression: "walletAddress = :walletAddress",
      ExpressionAttributeValues: {
        ":walletAddress": walletAddress.toLowerCase(),
      },
    })
    .promise();

  return result.Items || [];
}

/**
 * 応募 ID で応募を取得
 */
export async function getApplicationById(applicationId) {
  const result = await dynamoDB
    .get({
      TableName: TABLE,
      Key: { applicationId },
    })
    .promise();

  return result.Item || null;
}

/**
 * 応募ステータスを更新
 */
export async function updateApplicationStatus(applicationId, status) {
  await dynamoDB
    .update({
      TableName: TABLE,
      Key: { applicationId },
      UpdateExpression: "set #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
    .promise();
}
```

### 3.2 イベント応募ルートの実装

**ファイル**: `backend/src/routes/eventRoutes.js`

```javascript
import express from "express";
import {
  createApplication,
  getApplicationsByEvent,
  getApplicationsByWallet,
  getApplicationById,
  updateApplicationStatus,
} from "../lib/dynamo-events.js";

const router = express.Router();

/**
 * POST /api/events/:eventId/apply
 * イベントに応募
 */
router.post("/:eventId/apply", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { walletAddress, applicationText } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    // 既に応募しているかチェック
    const existingApplications = await getApplicationsByWallet(
      walletAddress.toLowerCase()
    );
    const alreadyApplied = existingApplications.some(
      (app) => app.eventId === eventId
    );

    if (alreadyApplied) {
      return res.status(409).json({ error: "Already applied to this event" });
    }

    const application = await createApplication({
      eventId,
      walletAddress,
      applicationText: applicationText || "",
    });

    res.status(201).json({ ok: true, application });
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/events/:eventId/applications
 * イベントの応募一覧を取得（企業向け）
 */
router.get("/:eventId/applications", async (req, res) => {
  try {
    const { eventId } = req.params;
    const applications = await getApplicationsByEvent(eventId);
    res.json({ ok: true, applications });
  } catch (err) {
    console.error("Error getting applications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/events/applications
 * 自分の応募一覧を取得（ユーザー向け）
 */
router.get("/applications", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const applications = await getApplicationsByWallet(walletAddress);
    res.json({ ok: true, applications });
  } catch (err) {
    console.error("Error getting applications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/events/applications/:applicationId/status
 * 応募ステータスを更新（企業向け）
 */
router.patch("/applications/:applicationId/status", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await updateApplicationStatus(applicationId, status);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error updating application status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
```

### 3.3 サーバーにルートを追加

**ファイル**: `backend/src/server.js`

```javascript
// ... existing code ...
import eventRoutes from "./routes/eventRoutes.js";

// ... existing code ...
app.use("/api/events", eventRoutes);
```

### 3.4 UUID パッケージのインストール

```bash
cd backend
npm install uuid
```

---

## 4. メッセージ API の実装

### 4.1 DynamoDB ユーティリティの作成

**ファイル**: `backend/src/lib/dynamo-messages.js`

```javascript
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);
const TABLE = "NonFungibleCareerMessages";

/**
 * 会話 ID を生成（送信者と受信者のアドレスをソートして結合）
 */
function generateConversationId(address1, address2) {
  const addresses = [address1.toLowerCase(), address2.toLowerCase()].sort();
  return `${addresses[0]}_${addresses[1]}`;
}

/**
 * メッセージを作成
 */
export async function createMessage(data) {
  const messageId = uuidv4();
  const conversationId = generateConversationId(
    data.senderAddress,
    data.receiverAddress
  );

  const message = {
    messageId,
    conversationId,
    senderAddress: data.senderAddress.toLowerCase(),
    receiverAddress: data.receiverAddress.toLowerCase(),
    content: data.content || "",
    sentAt: new Date().toISOString(),
    read: false,
  };

  await dynamoDB
    .put({
      TableName: TABLE,
      Item: message,
    })
    .promise();

  return message;
}

/**
 * 会話 ID でメッセージ一覧を取得
 */
export async function getMessagesByConversation(conversationId) {
  const result = await dynamoDB
    .query({
      TableName: TABLE,
      IndexName: "ConversationIndex",
      KeyConditionExpression: "conversationId = :conversationId",
      ExpressionAttributeValues: {
        ":conversationId": conversationId,
      },
      ScanIndexForward: false, // 新しい順
    })
    .promise();

  return result.Items || [];
}

/**
 * 送信者アドレスでメッセージ一覧を取得
 */
export async function getMessagesBySender(senderAddress) {
  const result = await dynamoDB
    .query({
      TableName: TABLE,
      IndexName: "SenderIndex",
      KeyConditionExpression: "senderAddress = :senderAddress",
      ExpressionAttributeValues: {
        ":senderAddress": senderAddress.toLowerCase(),
      },
    })
    .promise();

  return result.Items || [];
}

/**
 * 会話一覧を取得（送信者または受信者として参加している会話）
 */
export async function getConversations(walletAddress) {
  const address = walletAddress.toLowerCase();
  const sentMessages = await getMessagesBySender(address);

  // 会話 ID のセットを作成
  const conversationIds = new Set();
  sentMessages.forEach((msg) => {
    conversationIds.add(msg.conversationId);
  });

  // 各会話の最新メッセージを取得
  const conversations = [];
  for (const conversationId of conversationIds) {
    const messages = await getMessagesByConversation(conversationId);
    if (messages.length > 0) {
      const latestMessage = messages[0];
      const otherAddress =
        latestMessage.senderAddress === address
          ? latestMessage.receiverAddress
          : latestMessage.senderAddress;

      conversations.push({
        conversationId,
        otherAddress,
        latestMessage,
        unreadCount: messages.filter(
          (m) => m.receiverAddress === address && !m.read
        ).length,
      });
    }
  }

  return conversations.sort(
    (a, b) =>
      new Date(b.latestMessage.sentAt) - new Date(a.latestMessage.sentAt)
  );
}

/**
 * メッセージを既読にする
 */
export async function markMessageAsRead(messageId) {
  await dynamoDB
    .update({
      TableName: TABLE,
      Key: { messageId },
      UpdateExpression: "set #read = :read",
      ExpressionAttributeNames: {
        "#read": "read",
      },
      ExpressionAttributeValues: {
        ":read": true,
      },
    })
    .promise();
}
```

### 4.2 メッセージルートの実装

**ファイル**: `backend/src/routes/messageRoutes.js`

```javascript
import express from "express";
import {
  createMessage,
  getMessagesByConversation,
  getConversations,
  markMessageAsRead,
} from "../lib/dynamo-messages.js";

const router = express.Router();

/**
 * POST /api/messages
 * メッセージを送信
 */
router.post("/", async (req, res) => {
  try {
    const { senderAddress, receiverAddress, content } = req.body;

    if (!senderAddress || !receiverAddress) {
      return res
        .status(400)
        .json({ error: "senderAddress and receiverAddress are required" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "content is required" });
    }

    const message = await createMessage({
      senderAddress,
      receiverAddress,
      content: content.trim(),
    });

    res.status(201).json({ ok: true, message });
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/messages/conversations
 * 会話一覧を取得
 */
router.get("/conversations", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const conversations = await getConversations(walletAddress);
    res.json({ ok: true, conversations });
  } catch (err) {
    console.error("Error getting conversations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/messages/conversations/:conversationId
 * 会話のメッセージ一覧を取得
 */
router.get("/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await getMessagesByConversation(conversationId);
    res.json({ ok: true, messages });
  } catch (err) {
    console.error("Error getting messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/messages/:messageId/read
 * メッセージを既読にする
 */
router.patch("/:messageId/read", async (req, res) => {
  try {
    const { messageId } = req.params;
    await markMessageAsRead(messageId);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error marking message as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
```

### 4.3 サーバーにルートを追加

**ファイル**: `backend/src/server.js`

```javascript
// ... existing code ...
import messageRoutes from "./routes/messageRoutes.js";

// ... existing code ...
app.use("/api/messages", messageRoutes);
```

---

## 5. マッチング API の実装

### 5.1 DynamoDB ユーティリティの作成

**ファイル**: `backend/src/lib/dynamo-matches.js`

```javascript
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);
const TABLE = "NonFungibleCareerMatches";

/**
 * マッチングを作成
 */
export async function createMatch(data) {
  const matchId = uuidv4();
  const match = {
    matchId,
    studentAddress: data.studentAddress.toLowerCase(),
    orgAddress: data.orgAddress.toLowerCase(),
    zkpProofHash: data.zkpProofHash || null,
    matchedAt: new Date().toISOString(),
    status: "active",
  };

  await dynamoDB
    .put({
      TableName: TABLE,
      Item: match,
    })
    .promise();

  return match;
}

/**
 * 学生アドレスでマッチング一覧を取得
 */
export async function getMatchesByStudent(studentAddress) {
  const result = await dynamoDB
    .query({
      TableName: TABLE,
      IndexName: "StudentIndex",
      KeyConditionExpression: "studentAddress = :studentAddress",
      ExpressionAttributeValues: {
        ":studentAddress": studentAddress.toLowerCase(),
      },
    })
    .promise();

  return result.Items || [];
}

/**
 * 企業アドレスでマッチング一覧を取得
 */
export async function getMatchesByOrg(orgAddress) {
  const result = await dynamoDB
    .query({
      TableName: TABLE,
      IndexName: "OrgIndex",
      KeyConditionExpression: "orgAddress = :orgAddress",
      ExpressionAttributeValues: {
        ":orgAddress": orgAddress.toLowerCase(),
      },
    })
    .promise();

  return result.Items || [];
}

/**
 * マッチング ID でマッチングを取得
 */
export async function getMatchById(matchId) {
  const result = await dynamoDB
    .get({
      TableName: TABLE,
      Key: { matchId },
    })
    .promise();

  return result.Item || null;
}

/**
 * マッチングステータスを更新
 */
export async function updateMatchStatus(matchId, status) {
  await dynamoDB
    .update({
      TableName: TABLE,
      Key: { matchId },
      UpdateExpression: "set #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
    .promise();
}
```

### 5.2 マッチングルートの実装

**ファイル**: `backend/src/routes/matchRoutes.js`

```javascript
import express from "express";
import {
  createMatch,
  getMatchesByStudent,
  getMatchesByOrg,
  getMatchById,
  updateMatchStatus,
} from "../lib/dynamo-matches.js";

const router = express.Router();

/**
 * POST /api/matches
 * マッチングを作成
 */
router.post("/", async (req, res) => {
  try {
    const { studentAddress, orgAddress, zkpProofHash } = req.body;

    if (!studentAddress || !orgAddress) {
      return res
        .status(400)
        .json({ error: "studentAddress and orgAddress are required" });
    }

    // 既にマッチングが存在するかチェック
    const existingMatches = await getMatchesByStudent(studentAddress);
    const alreadyMatched = existingMatches.some(
      (match) =>
        match.orgAddress.toLowerCase() === orgAddress.toLowerCase() &&
        match.status === "active"
    );

    if (alreadyMatched) {
      return res.status(409).json({ error: "Match already exists" });
    }

    const match = await createMatch({
      studentAddress,
      orgAddress,
      zkpProofHash,
    });

    res.status(201).json({ ok: true, match });
  } catch (err) {
    console.error("Error creating match:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/student
 * 学生のマッチング一覧を取得
 */
router.get("/student", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const matches = await getMatchesByStudent(walletAddress);
    res.json({ ok: true, matches });
  } catch (err) {
    console.error("Error getting matches:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/org
 * 企業のマッチング一覧を取得
 */
router.get("/org", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const matches = await getMatchesByOrg(walletAddress);
    res.json({ ok: true, matches });
  } catch (err) {
    console.error("Error getting matches:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/:matchId
 * マッチング詳細を取得
 */
router.get("/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await getMatchById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.json({ ok: true, match });
  } catch (err) {
    console.error("Error getting match:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/matches/:matchId/status
 * マッチングステータスを更新
 */
router.patch("/:matchId/status", async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;

    if (!["active", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await updateMatchStatus(matchId, status);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error updating match status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
```

### 5.3 サーバーにルートを追加

**ファイル**: `backend/src/server.js`

```javascript
// ... existing code ...
import matchRoutes from "./routes/matchRoutes.js";

// ... existing code ...
app.use("/api/matches", matchRoutes);
```

---

## 6. フロントエンドとの統合

### 6.1 API クライアントの作成

**ファイル**: `frontend/src/lib/api.js`

```javascript
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * API リクエストの共通処理
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

/**
 * イベント応募 API
 */
export const eventAPI = {
  /**
   * イベントに応募
   */
  apply: async (eventId, walletAddress, applicationText) => {
    return request(`/events/${eventId}/apply`, {
      method: "POST",
      body: JSON.stringify({ walletAddress, applicationText }),
    });
  },

  /**
   * 自分の応募一覧を取得
   */
  getMyApplications: async (walletAddress) => {
    return request(`/events/applications?walletAddress=${walletAddress}`);
  },

  /**
   * イベントの応募一覧を取得（企業向け）
   */
  getEventApplications: async (eventId) => {
    return request(`/events/${eventId}/applications`);
  },
};

/**
 * メッセージ API
 */
export const messageAPI = {
  /**
   * メッセージを送信
   */
  send: async (senderAddress, receiverAddress, content) => {
    return request("/messages", {
      method: "POST",
      body: JSON.stringify({ senderAddress, receiverAddress, content }),
    });
  },

  /**
   * 会話一覧を取得
   */
  getConversations: async (walletAddress) => {
    return request(`/messages/conversations?walletAddress=${walletAddress}`);
  },

  /**
   * 会話のメッセージ一覧を取得
   */
  getMessages: async (conversationId) => {
    return request(`/messages/conversations/${conversationId}`);
  },

  /**
   * メッセージを既読にする
   */
  markAsRead: async (messageId) => {
    return request(`/messages/${messageId}/read`, {
      method: "PATCH",
    });
  },
};

/**
 * マッチング API
 */
export const matchAPI = {
  /**
   * マッチングを作成
   */
  create: async (studentAddress, orgAddress, zkpProofHash) => {
    return request("/matches", {
      method: "POST",
      body: JSON.stringify({ studentAddress, orgAddress, zkpProofHash }),
    });
  },

  /**
   * 学生のマッチング一覧を取得
   */
  getStudentMatches: async (walletAddress) => {
    return request(`/matches/student?walletAddress=${walletAddress}`);
  },

  /**
   * 企業のマッチング一覧を取得
   */
  getOrgMatches: async (walletAddress) => {
    return request(`/matches/org?walletAddress=${walletAddress}`);
  },
};
```

### 6.2 環境変数の設定

**ファイル**: `frontend/.env.local`

```env
# ... existing variables ...
VITE_API_BASE_URL=http://localhost:3000/api
```

### 6.3 フロントエンドページの更新

各ページで API を呼び出すように更新します。例として、`StudentEventApply.jsx` の更新：

```javascript
import { eventAPI } from "../lib/api.js";

// ... existing code ...

const handleSubmit = async (e) => {
  e.preventDefault();
  // ... validation ...

  try {
    await eventAPI.apply(eventId, account, applicationText);
    // ... success handling ...
  } catch (error) {
    // ... error handling ...
  }
};
```

---

## 7. 動作確認とテスト

### 7.1 バックエンドサーバーの起動

```bash
cd backend
npm run dev
```

### 7.2 テーブルの作成確認

```bash
cd backend
node scripts/create-api-tables.js
```

### 7.3 API エンドポイントのテスト

**イベント応募 API のテスト**:

```bash
# イベントに応募
curl -X POST http://localhost:3000/api/events/event-123/apply \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "applicationText": "応募動機です"
  }'

# 応募一覧を取得
curl http://localhost:3000/api/events/applications?walletAddress=0x1234567890123456789012345678901234567890
```

**メッセージ API のテスト**:

```bash
# メッセージを送信
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0x1111111111111111111111111111111111111111",
    "receiverAddress": "0x2222222222222222222222222222222222222222",
    "content": "こんにちは"
  }'

# 会話一覧を取得
curl http://localhost:3000/api/messages/conversations?walletAddress=0x1111111111111111111111111111111111111111
```

**マッチング API のテスト**:

```bash
# マッチングを作成
curl -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -d '{
    "studentAddress": "0x1111111111111111111111111111111111111111",
    "orgAddress": "0x2222222222222222222222222222222222222222"
  }'

# マッチング一覧を取得
curl http://localhost:3000/api/matches/student?walletAddress=0x1111111111111111111111111111111111111111
```

### 7.4 フロントエンドからの動作確認

1. フロントエンドを起動
2. イベント応募ページで応募を実行
3. メッセージページでメッセージを送信
4. マッチング機能をテスト

---

## 8. トラブルシューティング

### 8.1 DynamoDB 接続エラー

**問題**: DynamoDB に接続できない

**解決方法**:

```bash
# Docker コンテナが起動しているか確認
docker ps | grep dynamodb

# DynamoDB Local が起動しているか確認
curl http://localhost:8000

# Docker コンテナのログを確認
cd backend
npm run dynamodb:logs

# 環境変数を確認
cd backend
cat .env

# DynamoDB Local に接続できるかテスト
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region ap-northeast-1
```

**よくある原因**:

- Docker コンテナが起動していない → `npm run dynamodb:up` を実行
- ポート 8000 が既に使用されている → 他のプロセスを停止するか、`docker-compose.yml` でポートを変更（`docker compose` コマンドを使用）
- `DYNAMODB_ENDPOINT` が設定されていない → `.env` に `DYNAMODB_ENDPOINT=http://localhost:8000` を追加
- Docker がインストールされていない → Docker Desktop をインストール

### 8.2 CORS エラー

**問題**: フロントエンドから API にアクセスできない（CORS エラー）

**解決方法**:

`backend/src/server.js` で CORS 設定を確認：

```javascript
import cors from "cors";

app.use(
  cors({
    origin: "http://localhost:5173", // フロントエンドのURL
    credentials: true,
  })
);
```

### 8.3 テーブルが存在しないエラー

**問題**: テーブルが見つからない

**解決方法**:

```bash
# DynamoDB Local が起動していることを確認
docker ps | grep dynamodb

# テーブルを作成
cd backend
node scripts/create-api-tables.js

# テーブル一覧を確認（AWS CLI を使用）
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region ap-northeast-1

# 特定のテーブルの存在を確認
aws dynamodb describe-table \
  --table-name NonFungibleCareerEventApplications \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1
```

### 8.4 UUID パッケージのエラー

**問題**: `uuid` がインポートできない

**解決方法**:

```bash
cd backend
npm install uuid
```

### 8.5 ウォレットアドレスの大文字小文字問題

**問題**: ウォレットアドレスの検索がうまくいかない

**解決方法**:

すべてのウォレットアドレスを小文字に統一して保存・検索する：

```javascript
walletAddress.toLowerCase();
```

---

## まとめ

Day 7 では、以下の作業を完了しました：

- ✅ DynamoDB テーブルの設計と作成
- ✅ イベント応募 API の実装
- ✅ メッセージ API の実装
- ✅ マッチング API の実装
- ✅ フロントエンドとの統合
- ✅ 動作確認とテスト

次のステップ（Day 8）では、テストとアプリ完成度向上を行います。
