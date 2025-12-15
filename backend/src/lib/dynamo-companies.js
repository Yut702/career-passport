/**
 * 企業管理データ操作ライブラリ
 *
 * 企業のウォレットアドレスと企業名を紐づけるデータを管理します。
 */
import AWS from "aws-sdk";
import dotenv from "dotenv";

// 環境変数を読み込む
dotenv.config();

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  // DynamoDB Localを使用する場合、環境変数から認証情報を取得
  // credentialsオブジェクトを明示的に設定することで、環境変数や認証情報ファイルからの読み込みを上書き
  config.credentials = new AWS.Credentials(
    process.env.AWS_ACCESS_KEY_ID || "dummy",
    process.env.AWS_SECRET_ACCESS_KEY || "dummy"
  );
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);
const TABLE = "NonFungibleCareerCompanies";

/**
 * 企業を登録または更新
 * @param {Object} data - 企業データ
 * @param {string} data.walletAddress - ウォレットアドレス
 * @param {string} data.companyName - 企業名
 * @param {string} data.status - ステータス（active, inactive）
 * @returns {Promise<Object>} 登録された企業データ
 */
export async function createOrUpdateCompany(data) {
  try {
    const company = {
      walletAddress: data.walletAddress.toLowerCase(),
      companyName: data.companyName,
      status: data.status || "active",
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoDB
      .put({
        TableName: TABLE,
        Item: company,
      })
      .promise();

    return company;
  } catch (err) {
    console.error("Error in createOrUpdateCompany:", err);
    if (err.code === "ResourceNotFoundException") {
      throw new Error(
        `テーブル ${TABLE} が存在しません。テーブルを作成してください: npm run create-api-tables`
      );
    }
    if (err.message && err.message.includes("security token")) {
      throw new Error(
        `DynamoDB認証エラー: .envファイルにAWS_ACCESS_KEY_IDとAWS_SECRET_ACCESS_KEYが設定されているか確認してください。DynamoDB Localを使用する場合は、DYNAMODB_ENDPOINT=http://localhost:8000も設定してください。`
      );
    }
    throw err;
  }
}

/**
 * ウォレットアドレスで企業を取得
 * @param {string} walletAddress - ウォレットアドレス
 * @returns {Promise<Object|null>} 企業データ（見つからない場合はnull）
 */
export async function getCompanyByWalletAddress(walletAddress) {
  if (!walletAddress) {
    return null;
  }

  const result = await dynamoDB
    .get({
      TableName: TABLE,
      Key: {
        walletAddress: walletAddress.toLowerCase(),
      },
    })
    .promise();

  return result.Item || null;
}

/**
 * すべての企業を取得
 * @param {string} status - ステータスでフィルタ（オプション）
 * @returns {Promise<Array>} 企業データの配列
 */
export async function getAllCompanies(status = null) {
  const params = {
    TableName: TABLE,
  };

  const result = await dynamoDB.scan(params).promise();

  let companies = result.Items || [];

  // ステータスでフィルタ
  if (status) {
    companies = companies.filter((company) => company.status === status);
  }

  return companies;
}

/**
 * 企業のステータスを更新
 * @param {string} walletAddress - ウォレットアドレス
 * @param {string} status - 新しいステータス
 * @returns {Promise<Object>} 更新された企業データ
 */
export async function updateCompanyStatus(walletAddress, status) {
  const company = await getCompanyByWalletAddress(walletAddress);

  if (!company) {
    throw new Error("Company not found");
  }

  const updatedCompany = {
    ...company,
    status,
    updatedAt: new Date().toISOString(),
  };

  await dynamoDB
    .put({
      TableName: TABLE,
      Item: updatedCompany,
    })
    .promise();

  return updatedCompany;
}

/**
 * 企業を削除（論理削除）
 * @param {string} walletAddress - ウォレットアドレス
 * @returns {Promise<Object>} 削除された企業データ
 */
export async function deleteCompany(walletAddress) {
  return updateCompanyStatus(walletAddress, "inactive");
}
