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
const TABLE = "NonFungibleCareerEvents";

/**
 * イベントを作成
 */
export async function createEvent(data) {
  try {
    const eventId = uuidv4();
    const event = {
      eventId,
      orgWalletAddress: data.orgWalletAddress.toLowerCase(),
      title: data.title,
      description: data.description || "",
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location || "",
      maxParticipants: data.maxParticipants || null,
      status: data.status || "upcoming", // upcoming, active, completed, cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoDB
      .put({
        TableName: TABLE,
        Item: event,
      })
      .promise();

    return event;
  } catch (err) {
    console.error("Error in createEvent:", err);
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
 * イベントIDでイベントを取得
 */
export async function getEventById(eventId) {
  const result = await dynamoDB
    .get({
      TableName: TABLE,
      Key: { eventId },
    })
    .promise();

  return result.Item || null;
}

/**
 * 企業のウォレットアドレスでイベント一覧を取得
 */
export async function getEventsByOrg(orgWalletAddress) {
  try {
    const result = await dynamoDB
      .query({
        TableName: TABLE,
        IndexName: "OrgIndex",
        KeyConditionExpression: "orgWalletAddress = :orgWalletAddress",
        ExpressionAttributeValues: {
          ":orgWalletAddress": orgWalletAddress.toLowerCase(),
        },
        ScanIndexForward: false, // 新しい順
      })
      .promise();

    return result.Items || [];
  } catch (err) {
    // テーブルが存在しない場合やインデックスが存在しない場合は空配列を返す
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn(`Table or index not found for ${TABLE}:`, err.message);
      return [];
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
 * 全イベント一覧を取得（スキャン）
 */
export async function getAllEvents() {
  try {
    const result = await dynamoDB
      .scan({
        TableName: TABLE,
      })
      .promise();

    return result.Items || [];
  } catch (err) {
    // テーブルが存在しない場合は空配列を返す
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn(`Table not found for ${TABLE}:`, err.message);
      return [];
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
 * イベントを更新
 */
export async function updateEvent(eventId, updates) {
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(updates).forEach((key, index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = updates[key];
  });

  // updatedAtを自動更新
  updateExpressions.push("#updatedAt = :updatedAt");
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeValues[":updatedAt"] = new Date().toISOString();

  await dynamoDB
    .update({
      TableName: TABLE,
      Key: { eventId },
      UpdateExpression: `set ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
    .promise();
}

/**
 * イベントを削除
 */
export async function deleteEvent(eventId) {
  await dynamoDB
    .delete({
      TableName: TABLE,
      Key: { eventId },
    })
    .promise();
}
