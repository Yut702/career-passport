import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  // DynamoDB Localを使用する場合、環境変数から認証情報を取得
  config.accessKeyId = process.env.AWS_ACCESS_KEY_ID || "dummy";
  config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "dummy";
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);

export async function getUserByEmail(tableName, email) {
  const params = {
    TableName: tableName,
    Key: { email },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

export async function putUser(tableName, user) {
  const params = {
    TableName: tableName,
    Item: user,
  };
  await dynamoDB.put(params).promise();
}
