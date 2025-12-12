/**
 * イベント応募データ確認スクリプト（簡易版）
 *
 * 使用方法:
 *   node scripts/view-applications.js
 *   node scripts/view-applications.js --event event-1
 *   node scripts/view-applications.js --wallet 0x1111...
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
const TABLE = "NonFungibleCareerEventApplications";

// コマンドライン引数の解析
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace("--", "");
  const value = args[i + 1];
  if (key && value) {
    options[key] = value;
  }
}

async function viewApplications() {
  try {
    let items = [];

    if (options.event) {
      // イベントIDで検索
      console.log(`イベントID "${options.event}" の応募データを取得中...\n`);
      const result = await dynamoDB
        .query({
          TableName: TABLE,
          IndexName: "EventIndex",
          KeyConditionExpression: "eventId = :eventId",
          ExpressionAttributeValues: {
            ":eventId": options.event,
          },
        })
        .promise();
      items = result.Items || [];
    } else if (options.wallet) {
      // ウォレットアドレスで検索
      console.log(
        `ウォレットアドレス "${options.wallet}" の応募データを取得中...\n`
      );
      const result = await dynamoDB
        .query({
          TableName: TABLE,
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
      console.log("全応募データを取得中...\n");
      const result = await dynamoDB.scan({ TableName: TABLE }).promise();
      items = result.Items || [];
    }

    console.log(`=== イベント応募データ ===\n`);
    console.log(`合計: ${items.length} 件\n`);

    if (items.length === 0) {
      console.log("応募データがありません");
      return;
    }

    // テーブル形式で表示
    console.log(
      "┌─────────────────────────────────────────────────────────────────────────────┐"
    );
    console.log(
      "│ 応募ID          │ イベントID    │ ウォレットアドレス              │ ステータス │"
    );
    console.log(
      "├─────────────────────────────────────────────────────────────────────────────┤"
    );

    items.forEach((item) => {
      const appId = (item.applicationId || "").substring(0, 15) + "...";
      const eventId = (item.eventId || "").substring(0, 12);
      const wallet = (item.walletAddress || "").substring(0, 20) + "...";
      const status = item.status || "pending";
      const statusText =
        status === "approved"
          ? "承認済み"
          : status === "rejected"
          ? "却下"
          : "審査中";

      console.log(
        `│ ${appId.padEnd(15)} │ ${eventId.padEnd(12)} │ ${wallet.padEnd(
          30
        )} │ ${statusText.padEnd(9)} │`
      );
    });

    console.log(
      "└─────────────────────────────────────────────────────────────────────────────┘\n"
    );

    // 詳細情報を表示
    if (items.length <= 5) {
      console.log("=== 詳細情報 ===\n");
      items.forEach((item, index) => {
        console.log(`【応募 ${index + 1}】`);
        console.log(`  応募ID: ${item.applicationId}`);
        console.log(`  イベントID: ${item.eventId}`);
        console.log(`  ウォレットアドレス: ${item.walletAddress}`);
        console.log(`  ステータス: ${item.status || "pending"}`);
        console.log(
          `  応募日時: ${
            item.appliedAt
              ? new Date(item.appliedAt).toLocaleString("ja-JP")
              : "不明"
          }`
        );
        if (item.applicationText) {
          const text = item.applicationText.substring(0, 100);
          console.log(
            `  応募内容: ${text}${
              item.applicationText.length > 100 ? "..." : ""
            }`
          );
        }
        console.log();
      });
    } else {
      console.log("※ 詳細情報を表示するには、5件以下にフィルタしてください");
      console.log("   例: node scripts/view-applications.js --event event-1\n");
    }
  } catch (err) {
    console.error("エラー:", err.message);
    if (err.code === "ResourceNotFoundException") {
      console.error("テーブルが見つかりません。テーブルを作成してください:");
      console.error("  npm run create-api-tables");
    }
    process.exit(1);
  }
}

viewApplications();
