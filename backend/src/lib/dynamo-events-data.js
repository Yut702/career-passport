import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);
const TABLE = "NonFungibleCareerEvents";

/**
 * イベントを作成
 */
export async function createEvent(data) {
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
 * 全イベント一覧を取得（スキャン）
 */
export async function getAllEvents() {
  const result = await dynamoDB
    .scan({
      TableName: TABLE,
    })
    .promise();

  return result.Items || [];
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

