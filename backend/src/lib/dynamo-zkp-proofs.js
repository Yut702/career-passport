import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// 環境変数を読み込む
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const TABLE =
  process.env.DYNAMODB_TABLE_ZKP_PROOFS || "NonFungibleCareerZKPProofs";
const DATA_DIR = path.join(__dirname, "../../../frontend/src/data/zkp-proofs");

// dataフォルダが存在しない場合は作成
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * ZKP証明の完全なデータをdataフォルダに保存
 * @param {string} proofId - 証明ID
 * @param {Object} fullProofData - 完全な証明データ（秘密情報を含む）
 */
export function saveZKPProofToFile(proofId, fullProofData) {
  try {
    const filePath = path.join(DATA_DIR, `${proofId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(fullProofData, null, 2), "utf8");
    return filePath;
  } catch (err) {
    console.error("Error saving ZKP proof to file:", err);
    throw new Error("ZKP証明ファイルの保存に失敗しました");
  }
}

/**
 * ZKP証明の完全なデータをdataフォルダから読み込む
 * @param {string} proofId - 証明ID
 */
export function loadZKPProofFromFile(proofId) {
  try {
    const filePath = path.join(DATA_DIR, `${proofId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading ZKP proof from file:", err);
    return null;
  }
}

/**
 * ZKP証明の公開情報をデータベースに保存
 * @param {string} walletAddress - ウォレットアドレス
 * @param {string} proofId - 証明ID（ファイル名としても使用）
 * @param {Object} publicInfo - 公開情報のみ（publicInputs, proofHash, usedVCsなど）
 */
export async function saveZKPProofPublicInfo(
  walletAddress,
  proofId,
  publicInfo
) {
  try {
    const proofData = {
      proofId: proofId || uuidv4(),
      walletAddress: walletAddress.toLowerCase(),
      proofHash: publicInfo.proofHash,
      publicInputs: publicInfo.publicInputs || {},
      usedVCs: publicInfo.usedVCs || [],
      satisfiedConditions: publicInfo.satisfiedConditions || [],
      verified: publicInfo.verified !== undefined ? publicInfo.verified : true, // 検証済みフラグ
      verifiedAt: publicInfo.verifiedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await dynamoDB
      .put({
        TableName: TABLE,
        Item: proofData,
      })
      .promise();

    return proofData;
  } catch (err) {
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
 * ウォレットアドレスでZKP証明の公開情報を取得
 * @param {string} walletAddress - ウォレットアドレス
 */
export async function getZKPProofsByWallet(walletAddress) {
  try {
    const result = await dynamoDB
      .query({
        TableName: TABLE,
        IndexName: "WalletIndex",
        KeyConditionExpression: "walletAddress = :walletAddress",
        ExpressionAttributeValues: {
          ":walletAddress": walletAddress.toLowerCase(),
        },
      })
      .promise();

    return result.Items || [];
  } catch (err) {
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn(`Table or index not found for ${TABLE}:`, err.message);
      return [];
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
 * 証明IDでZKP証明の公開情報を取得
 * @param {string} proofId - 証明ID
 */
export async function getZKPProofById(proofId) {
  try {
    const result = await dynamoDB
      .get({
        TableName: TABLE,
        Key: { proofId },
      })
      .promise();

    return result.Item || null;
  } catch (err) {
    if (err.code === "ResourceNotFoundException") {
      console.warn(`Table not found for ${TABLE}:`, err.message);
      return null;
    }
    if (err.message && err.message.includes("security token")) {
      throw new Error(
        `DynamoDB認証エラー: .envファイルにAWS_ACCESS_KEY_IDとAWS_SECRET_ACCESS_KEYが設定されているか確認してください。DynamoDB Localを使用する場合は、DYNAMODB_ENDPOINT=http://localhost:8000も設定してください。`
      );
    }
    throw err;
  }
}
