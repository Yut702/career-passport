/**
 * ユーザーテーブル作成スクリプト
 *
 * 用途: 認証用のユーザーテーブル（NonFungibleCareerUsers）を作成
 * 実行方法: npm run create-table
 */
import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB(config);
const TABLE = process.env.DYNAMODB_TABLE_USERS || "NonFungibleCareerUsers";

async function createTable() {
  try {
    const tables = await dynamoDB.listTables().promise();
    if (tables.TableNames.includes(TABLE)) {
      console.log(`Table ${TABLE} already exists`);
      return;
    }

    const params = {
      TableName: TABLE,
      AttributeDefinitions: [{ AttributeName: "email", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
    };

    await dynamoDB.createTable(params).promise();
    console.log(`Created table ${TABLE}`);
  } catch (err) {
    console.error("create-table error", err);
    process.exit(1);
  }
}

createTable();
