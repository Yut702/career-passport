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
  // Users テーブル
  {
    TableName: "NonFungibleCareerUsers",
    KeySchema: [{ AttributeName: "walletAddress", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "walletAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },

  // Stamps テーブル
  {
    TableName: "NonFungibleCareerStamps",
    KeySchema: [{ AttributeName: "stampId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "stampId", AttributeType: "S" },
      { AttributeName: "userWalletAddress", AttributeType: "S" },
      { AttributeName: "organizationAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "UserWalletIndex",
        KeySchema: [{ AttributeName: "userWalletAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "OrganizationIndex",
        KeySchema: [{ AttributeName: "organizationAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },

  // StampsMetadata テーブル
  {
    TableName: "NonFungibleCareerStampsMetadata",
    KeySchema: [{ AttributeName: "stampId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "stampId", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },

  // NFTs テーブル
  {
    TableName: "NonFungibleCareerNFTs",
    KeySchema: [{ AttributeName: "tokenId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "tokenId", AttributeType: "N" },
      { AttributeName: "ownerWalletAddress", AttributeType: "S" },
      { AttributeName: "organizationAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "OwnerIndex",
        KeySchema: [{ AttributeName: "ownerWalletAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "OrganizationIndex",
        KeySchema: [{ AttributeName: "organizationAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },

  // NFTsMetadata テーブル
  {
    TableName: "NonFungibleCareerNFTsMetadata",
    KeySchema: [{ AttributeName: "tokenId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "tokenId", AttributeType: "N" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },

  // Events テーブル
  {
    TableName: "NonFungibleCareerEvents",
    KeySchema: [{ AttributeName: "eventId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "eventId", AttributeType: "S" },
      { AttributeName: "organizationAddress", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "OrganizationIndex",
        KeySchema: [{ AttributeName: "organizationAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },

  // EventParticipants テーブル
  {
    TableName: "NonFungibleCareerEventParticipants",
    KeySchema: [
      { AttributeName: "eventId", KeyType: "HASH" },
      { AttributeName: "participantWalletAddress", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "eventId", AttributeType: "S" },
      { AttributeName: "participantWalletAddress", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },

  // Messages テーブル
  {
    TableName: "NonFungibleCareerMessages",
    KeySchema: [
      { AttributeName: "messageId", KeyType: "HASH" },
      { AttributeName: "createdAt", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "messageId", AttributeType: "S" },
      { AttributeName: "createdAt", AttributeType: "S" },
      { AttributeName: "senderWalletAddress", AttributeType: "S" },
      { AttributeName: "recipientWalletAddress", AttributeType: "S" },
      { AttributeName: "threadId", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "SenderIndex",
        KeySchema: [{ AttributeName: "senderWalletAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "RecipientIndex",
        KeySchema: [{ AttributeName: "recipientWalletAddress", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "ThreadIndex",
        KeySchema: [{ AttributeName: "threadId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
];

async function createTables() {
  console.log("🔄 Creating DynamoDB tables...\n");

  for (const table of tables) {
    try {
      await dynamoDB.createTable(table).promise();
      console.log(`✅ Created table: ${table.TableName}`);
    } catch (err) {
      if (err.code === "ResourceInUseException") {
        console.log(`⚠️  Table already exists: ${table.TableName}`);
      } else {
        console.error(`❌ Error creating ${table.TableName}:`, err.message);
      }
    }
  }

  console.log("\n✅ Table setup complete!");
}

createTables().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
