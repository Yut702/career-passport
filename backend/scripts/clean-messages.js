/**
 * メッセージテーブルのデータのみをクリーンにするスクリプト
 *
 * 用途: NonFungibleCareerMessagesテーブル内のデータのみを削除（テーブル自体は削除しません）
 *
 * 注意: このスクリプトはテーブル内のデータのみを削除します。
 *       テーブル構造やインデックスは保持されます。
 *
 * 実行方法: node scripts/clean-messages.js
 */

import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  config.credentials = new AWS.Credentials(
    process.env.AWS_ACCESS_KEY_ID || "dummy",
    process.env.AWS_SECRET_ACCESS_KEY || "dummy"
  );
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);
const dynamoDBClient = new AWS.DynamoDB(config);

const TABLE_NAME = "NonFungibleCareerMessages";

/**
 * テーブル内のすべてのアイテムを削除
 */
async function deleteAllItems(tableName) {
  try {
    console.log(`📝 ${tableName} のデータを削除中...`);

    // テーブルのスキーマを取得してプライマリキーを特定
    const tableDescription = await dynamoDBClient
      .describeTable({ TableName: tableName })
      .promise();

    const keySchema = tableDescription.Table.KeySchema;
    // パーティションキーとソートキーの両方を取得（複合キーに対応）
    const partitionKey = keySchema.find((key) => key.KeyType === "HASH");
    const sortKey = keySchema.find((key) => key.KeyType === "RANGE");

    if (!partitionKey) {
      throw new Error(`テーブル ${tableName} のプライマリキーが見つかりません`);
    }

    let deletedCount = 0;
    let lastEvaluatedKey = null;

    do {
      // スキャンしてすべてのアイテムを取得
      const scanParams = {
        TableName: tableName,
      };

      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const scanResult = await dynamoDB.scan(scanParams).promise();

      // バッチで削除（DynamoDBの制限: 一度に25アイテムまで）
      if (scanResult.Items && scanResult.Items.length > 0) {
        const deleteRequests = scanResult.Items.map((item) => {
          // プライマリキー（パーティションキー + ソートキー）を構築
          const key = {};
          key[partitionKey.AttributeName] = item[partitionKey.AttributeName];
          if (sortKey) {
            key[sortKey.AttributeName] = item[sortKey.AttributeName];
          }
          return {
            DeleteRequest: {
              Key: key,
            },
          };
        });

        // 25アイテムずつバッチ削除
        for (let i = 0; i < deleteRequests.length; i += 25) {
          const batch = deleteRequests.slice(i, i + 25);
          const batchWriteParams = {
            RequestItems: {
              [tableName]: batch,
            },
          };

          await dynamoDB.batchWrite(batchWriteParams).promise();
          deletedCount += batch.length;
        }
      }

      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`✅ ${tableName}: ${deletedCount}件のデータを削除しました`);
    return deletedCount;
  } catch (error) {
    if (error.code === "ResourceNotFoundException") {
      console.log(`⚠️  ${tableName}: テーブルが存在しません（スキップ）`);
      return 0;
    }
    console.error(`❌ ${tableName} の削除エラー:`, error.message);
    throw error;
  }
}

/**
 * メッセージテーブルをクリーンアップ
 */
async function cleanMessages() {
  console.log("=== メッセージテーブルクリーンアップ開始 ===\n");
  console.log(
    `接続先: ${config.endpoint || `AWS DynamoDB (${config.region})`}\n`
  );
  console.log(
    "⚠️  注意: テーブル内のデータのみを削除します。テーブル構造は保持されます。\n"
  );

  try {
    const deleted = await deleteAllItems(TABLE_NAME);
    console.log("\n=== クリーンアップ完了 ===");
    console.log(`削除件数: ${deleted}件`);
  } catch (error) {
    console.error(`エラーが発生しました: ${error.message}\n`);
    process.exit(1);
  }
}

// 確認プロンプト（本番環境では注意）
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  `⚠️  警告: ${TABLE_NAME} テーブル内のすべてのデータを削除します（テーブル自体は削除しません）。続行しますか？ (yes/no): `,
  (answer) => {
    if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
      cleanMessages()
        .then(() => {
          console.log("\n✅ クリーンアップが完了しました");
          rl.close();
          process.exit(0);
        })
        .catch((error) => {
          console.error("\n❌ クリーンアップ中にエラーが発生しました:", error);
          rl.close();
          process.exit(1);
        });
    } else {
      console.log("❌ クリーンアップをキャンセルしました");
      rl.close();
      process.exit(0);
    }
  }
);
