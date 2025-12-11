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
