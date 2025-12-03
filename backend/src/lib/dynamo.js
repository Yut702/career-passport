import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  region: process.env.AWS_REGION || 'ap-northeast-1',
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);

export async function getUserByEmail(tableName, email) {
  const params = {
    TableName: tableName,
    Key: { email }
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

export async function putUser(tableName, user) {
  const params = {
    TableName: tableName,
    Item: user
  };
  await dynamoDB.put(params).promise();
}

// ========== Event / Stamp / Participant 関連 ==========

/**
 * 組織のイベント一覧を取得
 */
export async function getEventsByOrgEmail(tableName, orgEmail) {
  const params = {
    TableName: tableName,
    FilterExpression: 'orgEmail = :orgEmail',
    ExpressionAttributeValues: { ':orgEmail': orgEmail }
  };
  const result = await dynamoDB.scan(params).promise();
  return result.Items || [];
}

/**
 * イベントIDでスタンプ一覧を取得
 */
export async function getStampsByEventId(tableName, eventId) {
  const params = {
    TableName: tableName,
    FilterExpression: 'eventId = :eventId',
    ExpressionAttributeValues: { ':eventId': eventId }
  };
  const result = await dynamoDB.scan(params).promise();
  return result.Items || [];
}

/**
 * 組織のすべてのスタンプを取得
 */
export async function getStampsByOrgEmail(tableName, orgEmail) {
  const params = {
    TableName: tableName,
    FilterExpression: 'orgEmail = :orgEmail',
    ExpressionAttributeValues: { ':orgEmail': orgEmail }
  };
  const result = await dynamoDB.scan(params).promise();
  return result.Items || [];
}

/**
 * イベントを作成
 */
export async function putEvent(tableName, event) {
  const params = {
    TableName: tableName,
    Item: event
  };
  await dynamoDB.put(params).promise();
}

/**
 * スタンプを作成
 */
export async function putStamp(tableName, stamp) {
  const params = {
    TableName: tableName,
    Item: stamp
  };
  await dynamoDB.put(params).promise();
}
