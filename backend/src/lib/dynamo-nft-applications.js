import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  // DynamoDB Localを使用する場合、ダミーの認証情報を設定
  config.accessKeyId = "dummy";
  config.secretAccessKey = "dummy";
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);
const TABLE = "NonFungibleCareerNFTApplications";

/**
 * NFT申請を作成
 */
export async function createNFTApplication(data) {
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
