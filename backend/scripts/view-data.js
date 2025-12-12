/**
 * DynamoDB データ確認スクリプト
 *
 * 使用方法:
 *   node scripts/view-data.js [テーブル名] [オプション]
 *
 * 例:
 *   node scripts/view-data.js NonFungibleCareerEventApplications
 *   node scripts/view-data.js NonFungibleCareerEventApplications --event event-1
 *   node scripts/view-data.js NonFungibleCareerEventApplications --wallet 0x1111...
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

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);

// コマンドライン引数の解析
const args = process.argv.slice(2);
const tableName = args[0];
const options = {};

// オプションの解析
for (let i = 1; i < args.length; i += 2) {
  const key = args[i]?.replace("--", "");
  const value = args[i + 1];
  if (key && value) {
    options[key] = value;
  }
}

if (!tableName) {
  console.log("使用方法: node scripts/view-data.js [テーブル名] [オプション]");
  console.log("\n利用可能なテーブル:");
  console.log("  - NonFungibleCareerEventApplications");
  console.log("  - NonFungibleCareerMessages");
  console.log("  - NonFungibleCareerMatches");
  console.log("\nオプション:");
  console.log("  --event [eventId]     イベントIDでフィルタ");
  console.log("  --wallet [address]    ウォレットアドレスでフィルタ");
  console.log("\n例:");
  console.log("  node scripts/view-data.js NonFungibleCareerEventApplications");
  console.log(
    "  node scripts/view-data.js NonFungibleCareerEventApplications --event event-1"
  );
  console.log(
    "  node scripts/view-data.js NonFungibleCareerEventApplications --wallet 0x1111..."
  );
  process.exit(1);
}

async function viewData() {
  try {
    let items = [];

    if (tableName === "NonFungibleCareerEventApplications") {
      if (options.event) {
        // イベントIDで検索（GSI使用）
        const result = await dynamoDB
          .query({
            TableName: tableName,
            IndexName: "EventIndex",
            KeyConditionExpression: "eventId = :eventId",
            ExpressionAttributeValues: {
              ":eventId": options.event,
            },
          })
          .promise();
        items = result.Items || [];
      } else if (options.wallet) {
        // ウォレットアドレスで検索（GSI使用）
        const result = await dynamoDB
          .query({
            TableName: tableName,
            IndexName: "WalletIndex",
            KeyConditionExpression: "walletAddress = :walletAddress",
            ExpressionAttributeValues: {
              ":walletAddress": options.wallet.toLowerCase(),
            },
          })
          .promise();
        items = result.Items || [];
      } else {
        // 全データをスキャン
        const result = await dynamoDB.scan({ TableName: tableName }).promise();
        items = result.Items || [];
      }
    } else {
      // その他のテーブルは全データをスキャン
      const result = await dynamoDB.scan({ TableName: tableName }).promise();
      items = result.Items || [];
    }

    console.log(`\n=== ${tableName} のデータ ===\n`);
    console.log(`合計: ${items.length} 件\n`);

    if (items.length === 0) {
      console.log("データがありません");
      return;
    }

    // データを表示
    items.forEach((item, index) => {
      console.log(`--- レコード ${index + 1} ---`);
      console.log(JSON.stringify(item, null, 2));
      console.log();
    });
  } catch (err) {
    console.error("エラー:", err.message);
    if (err.code === "ResourceNotFoundException") {
      console.error("テーブルが見つかりません");
    }
    process.exit(1);
  }
}

viewData();
