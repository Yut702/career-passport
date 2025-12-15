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
const TABLE = "NonFungibleCareerMatches";

/**
 * マッチングを作成
 */
export async function createMatch(data) {
  try {
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
 * 学生アドレスでマッチング一覧を取得
 */
export async function getMatchesByStudent(studentAddress) {
  try {
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
 * 企業アドレスでマッチング一覧を取得
 */
export async function getMatchesByOrg(orgAddress) {
  try {
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
