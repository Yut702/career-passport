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
const TABLE = "NonFungibleCareerEventApplications";

/**
 * イベント応募を作成
 */
export async function createApplication(data) {
  try {
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
 * イベント ID で応募一覧を取得
 */
export async function getApplicationsByEvent(eventId) {
  try {
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
  } catch (err) {
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
 * ウォレットアドレスで応募一覧を取得
 */
export async function getApplicationsByWallet(walletAddress) {
  try {
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
  } catch (err) {
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
