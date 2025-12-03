import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  region: process.env.AWS_REGION || 'ap-northeast-1',
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB(config);

const tables = [
  {
    TableName: 'CareerPassportStamps',
    KeySchema: [{ AttributeName: 'stampId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'stampId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'organizationId', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIndex',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'OrganizationIndex',
        KeySchema: [{ AttributeName: 'organizationId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },
  {
    TableName: 'CareerPassportNFTs',
    KeySchema: [{ AttributeName: 'nftId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'nftId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIndex',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  },
];

async function createTables() {
  for (const table of tables) {
    try {
      await dynamoDB.createTable(table).promise();
      console.log(`✅ Created table: ${table.TableName}`);
    } catch (err) {
      if (err.code === 'ResourceInUseException') {
        console.log(`⚠️  Table already exists: ${table.TableName}`);
      } else {
        console.error(`❌ Error creating ${table.TableName}:`, err);
      }
    }
  }
}

createTables();

