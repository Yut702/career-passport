/**
 * 企業管理テーブル作成スクリプト
 *
 * 用途: 企業のウォレットアドレスと企業名を紐づけるテーブルを作成
 * 作成テーブル:
 *   - NonFungibleCareerCompanies: 企業データ
 * 実行方法: node scripts/create-companies-table.js
 */
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

const dynamoDB = new AWS.DynamoDB(config);

const table = {
  TableName: "NonFungibleCareerCompanies",
  KeySchema: [{ AttributeName: "walletAddress", KeyType: "HASH" }],
  AttributeDefinitions: [
    { AttributeName: "walletAddress", AttributeType: "S" },
  ],
  BillingMode: "PAY_PER_REQUEST",
};

async function createTable() {
  try {
    await dynamoDB.createTable(table).promise();
    console.log(`✅ Created table: ${table.TableName}`);
  } catch (err) {
    if (err.code === "ResourceInUseException") {
      console.log(`⚠️  Table already exists: ${table.TableName}`);
    } else {
      console.error(`❌ Error creating ${table.TableName}:`, err);
      throw err;
    }
  }
}

createTable()
  .then(() => {
    console.log("✅ Table creation completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Table creation failed:", err);
    process.exit(1);
  });
