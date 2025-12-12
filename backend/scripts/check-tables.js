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

async function checkTables() {
  try {
    const result = await dynamoDB.listTables().promise();
    console.log("=== 現在のテーブル一覧 ===");
    if (result.TableNames.length === 0) {
      console.log("テーブルが存在しません");
    } else {
      result.TableNames.forEach((name) => {
        console.log(`✅ ${name}`);
      });
    }
    console.log(`\n合計: ${result.TableNames.length} テーブル`);
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  }
}

checkTables();
