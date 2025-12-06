// lib/dynamo.js
import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);

// -----------------------------------------------------
// Get user by email
// -----------------------------------------------------
export async function getUserByEmail(tableName, email) {
  const params = {
    TableName: tableName,
    Key: { email },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

// -----------------------------------------------------
// putUser (パスワードを守りたい場合は同名フィールドを上書きしないロジックが必要)
// ⚠️ 完全上書きです。必要なら制御して下さい。
// -----------------------------------------------------
export async function putUser(tableName, Item) {
  const params = {
    TableName: tableName,
    Item,
  };
  await dynamoDB.put(params).promise();
}

// -----------------------------------------------------
// updateUserProfile（部分更新で安全）
// passwordHash を絶対に消さない！
// -----------------------------------------------------
export async function updateUserProfile(tableName, email, profile) {
  // UpdateExpression を動的に構築する
  const names = {};
  const values = {};
  const sets = [];

  for (const key of Object.keys(profile)) {
    // パスワードは絶対に更新させない
    if (key === "passwordHash") continue;

    names[`#${key}`] = key;
    values[`:${key}`] = profile[key];
    sets.push(`#${key} = :${key}`);
  }

  if (sets.length === 0) {
    // 更新項目がない場合
    return await getUserByEmail(tableName, email);
  }

  const params = {
    TableName: tableName,
    Key: { email },
    UpdateExpression: "SET " + sets.join(", "),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamoDB.update(params).promise();
  return result.Attributes;
}
