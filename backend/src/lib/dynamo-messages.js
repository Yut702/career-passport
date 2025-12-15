import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

// 環境変数を読み込む
dotenv.config();

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  // DynamoDB Localを使用する場合、環境変数から認証情報を取得
  // credentialsオブジェクトを明示的に設定することで、環境変数や認証情報ファイルからの読み込みを上書き
  config.credentials = new AWS.Credentials(
    process.env.AWS_ACCESS_KEY_ID || "dummy",
    process.env.AWS_SECRET_ACCESS_KEY || "dummy"
  );
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
  try {
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
  } catch (err) {
    if (err.code === "ResourceNotFoundException") {
      throw new Error(
        `テーブル ${TABLE} が存在しません。テーブルを作成してください: npm run create-api-tables`
      );
    }
    if (err.message && err.message.includes("security token")) {
      throw new Error(
        `DynamoDB認証エラー: .envファイルにAWS_ACCESS_KEY_IDとAWS_SECRET_ACCESS_KEYが設定されているか確認してください。DynamoDB Localを使用する場合は、DYNAMODB_ENDPOINT=http://localhost:8000も設定してください。`
      );
    }
    throw err;
  }
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
 * シンプルな実装：会話IDでグループ化して重複を防ぐ
 */
export async function getConversations(walletAddress) {
  const address = walletAddress.toLowerCase();

  // 送信者としてのメッセージを取得
  const sentMessages = await getMessagesBySender(address);

  // 受信者としてのメッセージを取得（スキャンを使用）
  const receivedMessages = await dynamoDB
    .scan({
      TableName: TABLE,
      FilterExpression: "receiverAddress = :receiverAddress",
      ExpressionAttributeValues: {
        ":receiverAddress": address,
      },
    })
    .promise()
    .then((result) => result.Items || []);

  // すべてのメッセージを結合
  const allMessages = [...sentMessages, ...receivedMessages];

  // 会話IDでグループ化（重複を防ぐ）
  const conversationMap = new Map();

  for (const msg of allMessages) {
    const conversationId = msg.conversationId;

    // 既に存在する会話の場合、最新のメッセージを保持
    if (!conversationMap.has(conversationId)) {
      conversationMap.set(conversationId, {
        conversationId,
        messages: [],
      });
    }
    conversationMap.get(conversationId).messages.push(msg);
  }

  // 各会話の情報を構築
  const conversations = [];
  for (const [conversationId, data] of conversationMap) {
    // メッセージを時系列でソート（新しい順）
    const sortedMessages = data.messages.sort(
      (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
    );

    if (sortedMessages.length > 0) {
      const latestMessage = sortedMessages[0];
      const otherAddress =
        latestMessage.senderAddress === address
          ? latestMessage.receiverAddress
          : latestMessage.senderAddress;

      conversations.push({
        conversationId,
        otherAddress,
        latestMessage,
        unreadCount: sortedMessages.filter(
          (m) => m.receiverAddress === address && !m.read
        ).length,
      });
    }
  }

  // 最新メッセージの時刻でソート（新しい順）
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
