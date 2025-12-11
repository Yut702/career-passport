import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const config = {
  region: process.env.AWS_REGION || "ap-northeast-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient(config);
const TABLE = "NonFungibleCareerMatches";

/**
 * マッチングを作成
 */
export async function createMatch(data) {
  const matchId = uuidv4();
  const match = {
    matchId,
    studentAddress: data.studentAddress.toLowerCase(),
    orgAddress: data.orgAddress.toLowerCase(),
    zkpProofHash: data.zkpProofHash || null,
    matchedAt: new Date().toISOString(),
    status: "active",
  };

  await dynamoDB
    .put({
      TableName: TABLE,
      Item: match,
    })
    .promise();

  return match;
}

/**
 * 学生アドレスでマッチング一覧を取得
 */
export async function getMatchesByStudent(studentAddress) {
  const result = await dynamoDB
    .query({
      TableName: TABLE,
      IndexName: "StudentIndex",
      KeyConditionExpression: "studentAddress = :studentAddress",
      ExpressionAttributeValues: {
        ":studentAddress": studentAddress.toLowerCase(),
      },
    })
    .promise();

  return result.Items || [];
}

/**
 * 企業アドレスでマッチング一覧を取得
 */
export async function getMatchesByOrg(orgAddress) {
  const result = await dynamoDB
    .query({
      TableName: TABLE,
      IndexName: "OrgIndex",
      KeyConditionExpression: "orgAddress = :orgAddress",
      ExpressionAttributeValues: {
        ":orgAddress": orgAddress.toLowerCase(),
      },
    })
    .promise();

  return result.Items || [];
}

/**
 * マッチング ID でマッチングを取得
 */
export async function getMatchById(matchId) {
  const result = await dynamoDB
    .get({
      TableName: TABLE,
      Key: { matchId },
    })
    .promise();

  return result.Item || null;
}

/**
 * マッチングステータスを更新
 */
export async function updateMatchStatus(matchId, status) {
  await dynamoDB
    .update({
      TableName: TABLE,
      Key: { matchId },
      UpdateExpression: "set #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
    .promise();
}
