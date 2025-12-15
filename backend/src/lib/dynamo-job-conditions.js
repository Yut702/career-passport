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
const JOB_CONDITIONS_TABLE = "NonFungibleCareerJobConditions";
const RECRUITMENT_CONDITIONS_TABLE = "NonFungibleCareerRecruitmentConditions";

/**
 * 学生側の求人条件を作成または更新
 */
export async function saveJobCondition(walletAddress, conditionData) {
  try {
    // 既存の条件を取得
    const existing = await getJobConditionByWallet(walletAddress);

    const conditionId = existing?.conditionId || uuidv4();
    const condition = {
      conditionId,
      walletAddress: walletAddress.toLowerCase(),
      ...conditionData,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await dynamoDB
      .put({
        TableName: JOB_CONDITIONS_TABLE,
        Item: condition,
      })
      .promise();

    return condition;
  } catch (err) {
    if (err.code === "ResourceNotFoundException") {
      throw new Error(
        `テーブル ${JOB_CONDITIONS_TABLE} が存在しません。テーブルを作成してください: npm run create-api-tables`
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
 * 学生アドレスで求人条件を取得
 */
export async function getJobConditionByWallet(walletAddress) {
  try {
    const result = await dynamoDB
      .query({
        TableName: JOB_CONDITIONS_TABLE,
        IndexName: "WalletIndex",
        KeyConditionExpression: "walletAddress = :walletAddress",
        ExpressionAttributeValues: {
          ":walletAddress": walletAddress.toLowerCase(),
        },
        Limit: 1,
      })
      .promise();

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (err) {
    // テーブルが存在しない場合やインデックスが存在しない場合はnullを返す
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn(
        `Table or index not found for ${JOB_CONDITIONS_TABLE}:`,
        err.message
      );
      return null;
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
 * 企業側の採用条件を作成または更新
 */
export async function saveRecruitmentCondition(orgAddress, conditionData) {
  try {
    // 既存の条件を取得
    const existing = await getRecruitmentConditionByOrg(orgAddress);

    const conditionId = existing?.conditionId || uuidv4();
    const condition = {
      conditionId,
      orgAddress: orgAddress.toLowerCase(),
      ...conditionData,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await dynamoDB
      .put({
        TableName: RECRUITMENT_CONDITIONS_TABLE,
        Item: condition,
      })
      .promise();

    return condition;
  } catch (err) {
    if (err.code === "ResourceNotFoundException") {
      throw new Error(
        `テーブル ${RECRUITMENT_CONDITIONS_TABLE} が存在しません。テーブルを作成してください: npm run create-api-tables`
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
 * 企業アドレスで採用条件を取得
 */
export async function getRecruitmentConditionByOrg(orgAddress) {
  try {
    const result = await dynamoDB
      .query({
        TableName: RECRUITMENT_CONDITIONS_TABLE,
        IndexName: "OrgIndex",
        KeyConditionExpression: "orgAddress = :orgAddress",
        ExpressionAttributeValues: {
          ":orgAddress": orgAddress.toLowerCase(),
        },
        Limit: 1,
      })
      .promise();

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (err) {
    // テーブルが存在しない場合やインデックスが存在しない場合はnullを返す
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn(
        `Table or index not found for ${RECRUITMENT_CONDITIONS_TABLE}:`,
        err.message
      );
      return null;
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
 * 全学生の求人条件を取得
 */
export async function getAllJobConditions() {
  try {
    const result = await dynamoDB
      .scan({
        TableName: JOB_CONDITIONS_TABLE,
      })
      .promise();

    return result.Items || [];
  } catch (err) {
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn(`Table not found for ${JOB_CONDITIONS_TABLE}:`, err.message);
      return [];
    }
    throw err;
  }
}

/**
 * 全企業の採用条件を取得
 */
export async function getAllRecruitmentConditions() {
  try {
    const result = await dynamoDB
      .scan({
        TableName: RECRUITMENT_CONDITIONS_TABLE,
      })
      .promise();

    return result.Items || [];
  } catch (err) {
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn(
        `Table not found for ${RECRUITMENT_CONDITIONS_TABLE}:`,
        err.message
      );
      return [];
    }
    throw err;
  }
}
