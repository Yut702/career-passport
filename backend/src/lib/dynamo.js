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
