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
const TABLE = "NonFungibleCareerNFTApplications";

/**
 * NFT申請を作成
 */
export async function createNFTApplication(data) {
  try {
    const applicationId = uuidv4();
    const application = {
      applicationId,
      userWalletAddress: data.userWalletAddress.toLowerCase(),
      orgWalletAddress: data.orgWalletAddress.toLowerCase(),
      organization: data.organization,
      stampCount: data.stampCount || 0,
      status: "pending", // pending, approved, rejected, issued
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
 * 申請IDで申請を取得
 */
export async function getNFTApplicationById(applicationId) {
  const result = await dynamoDB
    .get({
      TableName: TABLE,
      Key: { applicationId },
    })
    .promise();

  return result.Item || null;
}

/**
 * 企業のウォレットアドレスで申請一覧を取得
 */
export async function getNFTApplicationsByOrg(orgWalletAddress) {
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
}

/**
 * ユーザーのウォレットアドレスで申請一覧を取得
 */
export async function getNFTApplicationsByUser(userWalletAddress) {
  const result = await dynamoDB
    .query({
      TableName: TABLE,
      IndexName: "UserIndex",
      KeyConditionExpression: "userWalletAddress = :userWalletAddress",
      ExpressionAttributeValues: {
        ":userWalletAddress": userWalletAddress.toLowerCase(),
      },
      ScanIndexForward: false, // 新しい順
    })
    .promise();

  return result.Items || [];
}

/**
 * 申請を更新
 */
export async function updateNFTApplication(applicationId, updates) {
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
      Key: { applicationId },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
    .promise();

  return await getNFTApplicationById(applicationId);
}

/**
 * 申請を削除
 */
export async function deleteNFTApplication(applicationId) {
  await dynamoDB
    .delete({
      TableName: TABLE,
      Key: { applicationId },
    })
    .promise();
}
