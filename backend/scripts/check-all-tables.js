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

async function checkAllTables() {
  try {
    // 全テーブル一覧を取得
    const listResult = await dynamoDB.listTables().promise();
    const tableNames = listResult.TableNames;

    console.log("=== DynamoDB テーブル詳細確認 ===\n");
    console.log(`接続先: ${config.endpoint || `AWS DynamoDB (${config.region})`}\n`);

    if (tableNames.length === 0) {
      console.log("⚠️  テーブルが存在しません\n");
      return;
    }

    console.log(`📊 合計: ${tableNames.length} テーブル\n`);

    // 各テーブルの詳細を取得
    for (const tableName of tableNames.sort()) {
      try {
        const describeResult = await dynamoDB
          .describeTable({ TableName: tableName })
          .promise();

        const table = describeResult.Table;
        console.log(`📋 ${tableName}`);
        console.log(`   ステータス: ${table.TableStatus}`);
        console.log(`   アイテム数: ${table.ItemCount || 0}`);
        console.log(`   サイズ: ${(table.TableSizeBytes || 0).toLocaleString()} bytes`);

        // プライマリキー
        if (table.KeySchema) {
          console.log(`   プライマリキー:`);
          table.KeySchema.forEach((key) => {
            console.log(`     - ${key.AttributeName} (${key.KeyType})`);
          });
        }

        // グローバルセカンダリインデックス
        if (
          table.GlobalSecondaryIndexes &&
          table.GlobalSecondaryIndexes.length > 0
        ) {
          console.log(`   グローバルセカンダリインデックス (GSI):`);
          table.GlobalSecondaryIndexes.forEach((gsi) => {
            console.log(`     ✅ ${gsi.IndexName} (ステータス: ${gsi.IndexStatus})`);
            if (gsi.KeySchema) {
              gsi.KeySchema.forEach((key) => {
                console.log(`        - ${key.AttributeName} (${key.KeyType})`);
              });
            }
          });
        } else {
          console.log(`   GSI: なし`);
        }

        console.log("");
      } catch (err) {
        console.error(`   ❌ エラー: ${err.message}\n`);
      }
    }

    // 期待されるテーブルリスト
    const expectedTables = [
      "NonFungibleCareerEvents",
      "NonFungibleCareerEventApplications",
      "NonFungibleCareerMessages",
      "NonFungibleCareerMatches",
    ];

    console.log("=== 期待されるテーブルとの比較 ===");
    const missingTables = expectedTables.filter(
      (name) => !tableNames.includes(name)
    );
    const extraTables = tableNames.filter(
      (name) => !expectedTables.includes(name)
    );

    if (missingTables.length === 0 && extraTables.length === 0) {
      console.log("✅ 全ての期待されるテーブルが存在します\n");
    } else {
      if (missingTables.length > 0) {
        console.log(`⚠️  不足しているテーブル (${missingTables.length}):`);
        missingTables.forEach((name) => {
          console.log(`   - ${name}`);
        });
        console.log("");
      }
      if (extraTables.length > 0) {
        console.log(`ℹ️  追加のテーブル (${extraTables.length}):`);
        extraTables.forEach((name) => {
          console.log(`   - ${name}`);
        });
        console.log("");
      }
    }
  } catch (err) {
    console.error("❌ エラー:", err.message);
    if (err.code === "ResourceNotFoundException") {
      console.error("DynamoDBに接続できません。DynamoDB Localが起動しているか確認してください。");
    }
    process.exit(1);
  }
}

checkAllTables();

