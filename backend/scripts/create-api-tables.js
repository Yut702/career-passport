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

const tables = [
  {
    TableName: "NonFungibleCareerEventApplications",
    KeySchema: [{ AttributeName: "applicationId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "applicationId", AttributeType: "S" },
      { AttributeName: "eventId", AttributeType: "S" },
      { AttributeName: "walletAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "EventIndex",
        KeySchema: [{ AttributeName: "eventId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "WalletIndex",
        KeySchema: [{ AttributeName: "walletAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  {
    TableName: "NonFungibleCareerMessages",
    KeySchema: [{ AttributeName: "messageId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "messageId", AttributeType: "S" },
      { AttributeName: "conversationId", AttributeType: "S" },
      { AttributeName: "senderAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "ConversationIndex",
        KeySchema: [{ AttributeName: "conversationId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "SenderIndex",
        KeySchema: [{ AttributeName: "senderAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  {
    TableName: "NonFungibleCareerMatches",
    KeySchema: [{ AttributeName: "matchId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "matchId", AttributeType: "S" },
      { AttributeName: "studentAddress", AttributeType: "S" },
      { AttributeName: "orgAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "StudentIndex",
        KeySchema: [{ AttributeName: "studentAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "OrgIndex",
        KeySchema: [{ AttributeName: "orgAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
];

async function createTables() {
  console.log("=== DynamoDB テーブル作成開始 ===\n");
  console.log(
    `接続先: ${config.endpoint || `AWS DynamoDB (${config.region})`}\n`
  );

  for (const table of tables) {
    try {
      console.log(`📝 テーブル作成中: ${table.TableName}...`);
      await dynamoDB.createTable(table).promise();
      console.log(`✅ 作成完了: ${table.TableName}\n`);
    } catch (err) {
      if (err.code === "ResourceInUseException") {
        console.log(`⚠️  既に存在: ${table.TableName}\n`);
      } else {
        console.error(`❌ エラー: ${table.TableName}`);
        console.error(`   エラー内容: ${err.message}\n`);
      }
    }
  }

  console.log("=== テーブル作成完了 ===");
}

createTables();
