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

const STAMPS_TABLE =
  process.env.DYNAMODB_TABLE_STAMPS || "NonFungibleCareerStamps";
const NFTS_TABLE = process.env.DYNAMODB_TABLE_NFTS || "NonFungibleCareerNFTs";

// スタンプ関連
export async function getStampsByUser(userId) {
  const params = {
    TableName: STAMPS_TABLE,
    IndexName: "UserIndex",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function getStampsByOrganization(organizationId) {
  const params = {
    TableName: STAMPS_TABLE,
    IndexName: "OrganizationIndex",
    KeyConditionExpression: "organizationId = :orgId",
    ExpressionAttributeValues: {
      ":orgId": organizationId,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function createStamp(stamp) {
  const params = {
    TableName: STAMPS_TABLE,
    Item: {
      stampId:
        stamp.stampId ||
        `stamp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: stamp.userId,
      organizationId: stamp.organizationId,
      name: stamp.name,
      organization: stamp.organization,
      category: stamp.category,
      issuedAt: stamp.issuedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  };
  await dynamoDB.put(params).promise();
  return params.Item;
}

export async function getStamp(stampId) {
  const params = {
    TableName: STAMPS_TABLE,
    Key: { stampId },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

// NFT関連
export async function getNFTsByUser(userId) {
  const params = {
    TableName: NFTS_TABLE,
    IndexName: "UserIndex",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function createNFT(nft) {
  const params = {
    TableName: NFTS_TABLE,
    Item: {
      nftId:
        nft.nftId ||
        `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: nft.userId,
      tokenId: nft.tokenId,
      name: nft.name,
      description: nft.description || "",
      rarity: nft.rarity,
      organizations: nft.organizations || [],
      stampIds: nft.stampIds || [],
      contractAddress: nft.contractAddress || "",
      transactionHash: nft.transactionHash || "",
      metadataURI: nft.metadataURI || "",
      mintedAt: nft.mintedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  };
  await dynamoDB.put(params).promise();
  return params.Item;
}

export async function getNFT(nftId) {
  const params = {
    TableName: NFTS_TABLE,
    Key: { nftId },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}
