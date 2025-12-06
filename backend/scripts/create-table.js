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
const TABLE = process.env.DYNAMODB_TABLE_USERS || 'CareerPassportUsers';
const TABLE_EVENTS = process.env.DYNAMODB_TABLE_EVENTS || 'CareerPassportEvents';
const TABLE_STAMPS = process.env.DYNAMODB_TABLE_STAMPS || 'CareerPassportStamps';

async function createTable() {
  try {
    const tables = await dynamoDB.listTables().promise();
    
    // Users テーブル
    if (tables.TableNames.includes(TABLE)) {
      console.log(`Table ${TABLE} already exists`);
    } else {
      const params = {
        TableName: TABLE,
        AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST'
      };
      await dynamoDB.createTable(params).promise();
      console.log(`Created table ${TABLE}`);
    }

    // Events テーブル
    if (tables.TableNames.includes(TABLE_EVENTS)) {
      console.log(`Table ${TABLE_EVENTS} already exists`);
    } else {
      const params = {
        TableName: TABLE_EVENTS,
        AttributeDefinitions: [{ AttributeName: 'eventId', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'eventId', KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST'
      };
      await dynamoDB.createTable(params).promise();
      console.log(`Created table ${TABLE_EVENTS}`);
    }

    // Stamps テーブル
    if (tables.TableNames.includes(TABLE_STAMPS)) {
      console.log(`Table ${TABLE_STAMPS} already exists`);
    } else {
      const params = {
        TableName: TABLE_STAMPS,
        AttributeDefinitions: [{ AttributeName: 'stampId', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'stampId', KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST'
      };
      await dynamoDB.createTable(params).promise();
      console.log(`Created table ${TABLE_STAMPS}`);
    }

  } catch (err) {
    console.error('create-table error', err);
    process.exit(1);
  }
}

createTable();
