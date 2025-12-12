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
