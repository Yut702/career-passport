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

async function checkIndexes() {
  try {
    const tableName = "NonFungibleCareerEventApplications";
    const result = await dynamoDB
      .describeTable({ TableName: tableName })
      .promise();

    console.log(`=== ${tableName} の詳細 ===`);
    console.log(`ステータス: ${result.Table.TableStatus}`);
    console.log(`\nグローバルセカンダリインデックス (GSI):`);

    if (
      result.Table.GlobalSecondaryIndexes &&
      result.Table.GlobalSecondaryIndexes.length > 0
    ) {
      result.Table.GlobalSecondaryIndexes.forEach((gsi) => {
        console.log(`  ✅ ${gsi.IndexName} (ステータス: ${gsi.IndexStatus})`);
      });
    } else {
      console.log("  ⚠️  GSIが存在しません");
    }
  } catch (err) {
    console.error("エラー:", err.message);
    if (err.code === "ResourceNotFoundException") {
      console.error("テーブルが見つかりません");
    }
    process.exit(1);
  }
}

checkIndexes();
