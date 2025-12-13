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
const JOB_CONDITIONS_TABLE = "NonFungibleCareerJobConditions";
const RECRUITMENT_CONDITIONS_TABLE = "NonFungibleCareerRecruitmentConditions";

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

async function viewJobConditions() {
  try {
    console.log("=== 求人条件データベース確認 ===\n");
    console.log(
      `接続先: ${config.endpoint || `AWS DynamoDB (${config.region})`}\n`
    );

    // 学生側の求人条件を取得
    console.log("📋 学生側の求人条件 (NonFungibleCareerJobConditions)\n");
    let jobConditions = [];

    if (options.wallet) {
      // ウォレットアドレスで検索（GSI使用）
      console.log(
        `ウォレットアドレス "${options.wallet}" の求人条件を取得中...\n`
      );
      const result = await dynamoDB
        .query({
          TableName: JOB_CONDITIONS_TABLE,
          IndexName: "WalletIndex",
          KeyConditionExpression: "walletAddress = :walletAddress",
          ExpressionAttributeValues: {
            ":walletAddress": options.wallet.toLowerCase(),
          },
        })
        .promise();
      jobConditions = result.Items || [];
    } else {
      // 全データをスキャン
      console.log("全求人条件データを取得中...\n");
      const result = await dynamoDB
        .scan({ TableName: JOB_CONDITIONS_TABLE })
        .promise();
      jobConditions = result.Items || [];
    }

    console.log(`合計: ${jobConditions.length} 件\n`);

    if (jobConditions.length === 0) {
      console.log("求人条件データがありません\n");
    } else {
      // データを表示
      jobConditions.forEach((item, index) => {
        console.log(`--- レコード ${index + 1} ---`);
        console.log(`条件ID: ${item.conditionId}`);
        console.log(`ウォレットアドレス: ${item.walletAddress}`);
        console.log(`仕事の種類: ${item.jobType || "未設定"}`);
        console.log(`職種カテゴリ: ${item.positionCategory || "未設定"}`);
        console.log(`職種: ${item.position || "未設定"}`);
        console.log(`勤務地: ${item.location || "未設定"}`);
        console.log(`業界: ${item.industry || "未設定"}`);
        console.log(`給与: ${item.salary || "未設定"}`);
        console.log(`働き方: ${item.workStyle || "未設定"}`);
        console.log(
          `スキル: ${
            item.skills && item.skills.length > 0
              ? item.skills.join(", ")
              : "未設定"
          }`
        );
        console.log(`作成日時: ${item.createdAt || "不明"}`);
        console.log(`更新日時: ${item.updatedAt || "不明"}`);
        console.log();
      });
    }

    // 企業側の採用条件を取得
    console.log(
      "\n📋 企業側の採用条件 (NonFungibleCareerRecruitmentConditions)\n"
    );
    let recruitmentConditions = [];

    if (options.org) {
      // 企業アドレスで検索（GSI使用）
      console.log(`企業アドレス "${options.org}" の採用条件を取得中...\n`);
      const result = await dynamoDB
        .query({
          TableName: RECRUITMENT_CONDITIONS_TABLE,
          IndexName: "OrgIndex",
          KeyConditionExpression: "orgAddress = :orgAddress",
          ExpressionAttributeValues: {
            ":orgAddress": options.org.toLowerCase(),
          },
        })
        .promise();
      recruitmentConditions = result.Items || [];
    } else {
      // 全データをスキャン
      console.log("全採用条件データを取得中...\n");
      const result = await dynamoDB
        .scan({ TableName: RECRUITMENT_CONDITIONS_TABLE })
        .promise();
      recruitmentConditions = result.Items || [];
    }

    console.log(`合計: ${recruitmentConditions.length} 件\n`);

    if (recruitmentConditions.length === 0) {
      console.log("採用条件データがありません\n");
    } else {
      // データを表示
      recruitmentConditions.forEach((item, index) => {
        console.log(`--- レコード ${index + 1} ---`);
        console.log(`条件ID: ${item.conditionId}`);
        console.log(`企業アドレス: ${item.orgAddress}`);
        console.log(`仕事の種類: ${item.jobType || "未設定"}`);
        console.log(`職種カテゴリ: ${item.positionCategory || "未設定"}`);
        console.log(`職種: ${item.position || "未設定"}`);
        console.log(`業界: ${item.industry || "未設定"}`);
        console.log(
          `必須スキル: ${
            item.requiredSkills && item.requiredSkills.length > 0
              ? item.requiredSkills.join(", ")
              : "未設定"
          }`
        );
        console.log(
          `希望スキル: ${
            item.preferredSkills && item.preferredSkills.length > 0
              ? item.preferredSkills.join(", ")
              : "未設定"
          }`
        );
        console.log(`勤務地: ${item.location || "未設定"}`);
        console.log(`働き方: ${item.workStyle || "未設定"}`);
        console.log(`給与: ${item.salary || "未設定"}`);
        console.log(`説明: ${item.description || "未設定"}`);
        console.log(`作成日時: ${item.createdAt || "不明"}`);
        console.log(`更新日時: ${item.updatedAt || "不明"}`);
        console.log();
      });
    }
  } catch (err) {
    console.error("エラー:", err.message);
    if (err.code === "ResourceNotFoundException") {
      console.error("テーブルが見つかりません");
    }
    process.exit(1);
  }
}

viewJobConditions();
