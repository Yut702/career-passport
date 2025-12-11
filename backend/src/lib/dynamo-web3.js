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

// ============ Users テーブル ============

export async function getUserByWallet(walletAddress) {
  const params = {
    TableName: "NonFungibleCareerUsers",
    Key: { walletAddress },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

export async function createUser(walletAddress, userType, organizationName = null) {
  const params = {
    TableName: "NonFungibleCareerUsers",
    Item: {
      walletAddress,
      userType, // "student" | "organization"
      organizationName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  await dynamoDB.put(params).promise();
  return params.Item;
}

export async function updateUser(walletAddress, updates) {
  const updateExpression = [];
  const expressionAttributeValues = {};

  Object.entries(updates).forEach(([key, value], index) => {
    updateExpression.push(`${key} = :val${index}`);
    expressionAttributeValues[`:val${index}`] = value;
  });

  expressionAttributeValues[":now"] = new Date().toISOString();
  updateExpression.push("updatedAt = :now");

  const params = {
    TableName: "NonFungibleCareerUsers",
    Key: { walletAddress },
    UpdateExpression: `SET ${updateExpression.join(", ")}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamoDB.update(params).promise();
  return result.Attributes;
}

// ============ Stamps テーブル ============

export async function getStampsByUser(userWalletAddress) {
  const params = {
    TableName: "NonFungibleCareerStamps",
    IndexName: "UserWalletIndex",
    KeyConditionExpression: "userWalletAddress = :userWallet",
    ExpressionAttributeValues: {
      ":userWallet": userWalletAddress,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function getStampsByOrganization(organizationAddress) {
  const params = {
    TableName: "NonFungibleCareerStamps",
    IndexName: "OrganizationIndex",
    KeyConditionExpression: "organizationAddress = :orgAddress",
    ExpressionAttributeValues: {
      ":orgAddress": organizationAddress,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function createStamp(
  stampId,
  userWalletAddress,
  organizationAddress,
  category,
  metadataUri,
  timestamp
) {
  const params = {
    TableName: "NonFungibleCareerStamps",
    Item: {
      stampId,
      userWalletAddress,
      organizationAddress,
      category,
      metadataUri,
      timestamp,
      createdAt: new Date().toISOString(),
    },
  };
  await dynamoDB.put(params).promise();
  return params.Item;
}

export async function getStamp(stampId) {
  const params = {
    TableName: "NonFungibleCareerStamps",
    Key: { stampId },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

// ============ StampsMetadata テーブル ============

export async function createStampMetadata(
  stampId,
  imageUrl,
  description,
  certificateCategory,
  issuerName = "",
  issuedDate = ""
) {
  const params = {
    TableName: "NonFungibleCareerStampsMetadata",
    Item: {
      stampId,
      imageUrl,
      description,
      certificateCategory,
      issuerName,
      issuedDate,
      updatedAt: new Date().toISOString(),
    },
  };
  await dynamoDB.put(params).promise();
  return params.Item;
}

export async function getStampMetadata(stampId) {
  const params = {
    TableName: "NonFungibleCareerStampsMetadata",
    Key: { stampId },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

// ============ NFTs テーブル ============

export async function getNFTsByUser(ownerWalletAddress) {
  const params = {
    TableName: "NonFungibleCareerNFTs",
    IndexName: "OwnerIndex",
    KeyConditionExpression: "ownerWalletAddress = :ownerWallet",
    ExpressionAttributeValues: {
      ":ownerWallet": ownerWalletAddress,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function getNFTsByOrganization(organizationAddress) {
  const params = {
    TableName: "NonFungibleCareerNFTs",
    IndexName: "OrganizationIndex",
    KeyConditionExpression: "organizationAddress = :orgAddress",
    ExpressionAttributeValues: {
      ":orgAddress": organizationAddress,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function createNFT(
  tokenId,
  ownerWalletAddress,
  organizationAddress,
  contractAddress,
  metadataUri,
  acquiredAt,
  transactionHash
) {
  const params = {
    TableName: "NonFungibleCareerNFTs",
    Item: {
      tokenId,
      ownerWalletAddress,
      organizationAddress,
      contractAddress,
      metadataUri,
      acquiredAt,
      transactionHash,
      createdAt: new Date().toISOString(),
    },
  };
  await dynamoDB.put(params).promise();
  return params.Item;
}

export async function getNFT(tokenId) {
  const params = {
    TableName: "NonFungibleCareerNFTs",
    Key: { tokenId },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

// ============ NFTsMetadata テーブル ============

export async function createNFTMetadata(
  tokenId,
  imageUrl,
  displayName,
  description,
  certificateCategory,
  rarity,
  organizationsList = [],
  stampIds = []
) {
  const params = {
    TableName: "NonFungibleCareerNFTsMetadata",
    Item: {
      tokenId,
      imageUrl,
      displayName,
      description,
      certificateCategory,
      rarity,
      organizationsList,
      stampIds,
      updatedAt: new Date().toISOString(),
    },
  };
  await dynamoDB.put(params).promise();
  return params.Item;
}

export async function getNFTMetadata(tokenId) {
  const params = {
    TableName: "NonFungibleCareerNFTsMetadata",
    Key: { tokenId },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

// ============ Events テーブル ============

export async function createEvent(
  eventId,
  organizationAddress,
  eventName,
  eventDescription,
  eventDate,
  location,
  imageUrl,
  maxParticipants = 50,
  status = "planning"
) {
  const params = {
    TableName: "NonFungibleCareerEvents",
    Item: {
      eventId,
      organizationAddress,
      eventName,
      eventDescription,
      eventDate,
      location,
      imageUrl,
      maxParticipants,
      currentParticipants: 0,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  await dynamoDB.put(params).promise();
  return params.Item;
}

export async function getEvent(eventId) {
  const params = {
    TableName: "NonFungibleCareerEvents",
    Key: { eventId },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

export async function getEventsByOrganization(organizationAddress) {
  const params = {
    TableName: "NonFungibleCareerEvents",
    IndexName: "OrganizationIndex",
    KeyConditionExpression: "organizationAddress = :orgAddress",
    ExpressionAttributeValues: {
      ":orgAddress": organizationAddress,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function getEventsByStatus(status) {
  const params = {
    TableName: "NonFungibleCareerEvents",
    IndexName: "StatusIndex",
    KeyConditionExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": status,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function updateEvent(eventId, updates) {
  const updateExpression = [];
  const expressionAttributeValues = {};

  Object.entries(updates).forEach(([key, value], index) => {
    updateExpression.push(`${key} = :val${index}`);
    expressionAttributeValues[`:val${index}`] = value;
  });

  expressionAttributeValues[":now"] = new Date().toISOString();
  updateExpression.push("updatedAt = :now");

  const params = {
    TableName: "NonFungibleCareerEvents",
    Key: { eventId },
    UpdateExpression: `SET ${updateExpression.join(", ")}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamoDB.update(params).promise();
  return result.Attributes;
}

// ============ EventParticipants テーブル ============

export async function addEventParticipant(
  eventId,
  participantWalletAddress,
  status = "registered"
) {
  const params = {
    TableName: "NonFungibleCareerEventParticipants",
    Item: {
      eventId,
      participantWalletAddress,
      joinDate: new Date().toISOString(),
      status,
      stampAwarded: false,
    },
  };
  await dynamoDB.put(params).promise();

  // Event の currentParticipants をインクリメント
  const event = await getEvent(eventId);
  if (event) {
    await updateEvent(eventId, {
      currentParticipants: event.currentParticipants + 1,
    });
  }

  return params.Item;
}

export async function getEventParticipants(eventId) {
  const params = {
    TableName: "NonFungibleCareerEventParticipants",
    KeyConditionExpression: "eventId = :eventId",
    ExpressionAttributeValues: {
      ":eventId": eventId,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function updateEventParticipant(
  eventId,
  participantWalletAddress,
  updates
) {
  const updateExpression = [];
  const expressionAttributeValues = {};

  Object.entries(updates).forEach(([key, value], index) => {
    updateExpression.push(`${key} = :val${index}`);
    expressionAttributeValues[`:val${index}`] = value;
  });

  const params = {
    TableName: "NonFungibleCareerEventParticipants",
    Key: {
      eventId,
      participantWalletAddress,
    },
    UpdateExpression: `SET ${updateExpression.join(", ")}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamoDB.update(params).promise();
  return result.Attributes;
}

// ============ Messages テーブル ============

export async function createMessage(
  messageId,
  senderWalletAddress,
  recipientWalletAddress,
  threadId,
  messageBody,
  vcClaimShared = {}
) {
  const params = {
    TableName: "NonFungibleCareerMessages",
    Item: {
      messageId,
      createdAt: new Date().toISOString(),
      senderWalletAddress,
      recipientWalletAddress,
      threadId,
      messageBody,
      vcClaimShared,
    },
  };
  await dynamoDB.put(params).promise();
  return params.Item;
}

export async function getMessagesByThread(threadId) {
  const params = {
    TableName: "NonFungibleCareerMessages",
    IndexName: "ThreadIndex",
    KeyConditionExpression: "threadId = :threadId",
    ExpressionAttributeValues: {
      ":threadId": threadId,
    },
    ScanIndexForward: true, // 古い順
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function getMessagesBySender(senderWalletAddress) {
  const params = {
    TableName: "NonFungibleCareerMessages",
    IndexName: "SenderIndex",
    KeyConditionExpression: "senderWalletAddress = :sender",
    ExpressionAttributeValues: {
      ":sender": senderWalletAddress,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}

export async function getMessagesByRecipient(recipientWalletAddress) {
  const params = {
    TableName: "NonFungibleCareerMessages",
    IndexName: "RecipientIndex",
    KeyConditionExpression: "recipientWalletAddress = :recipient",
    ExpressionAttributeValues: {
      ":recipient": recipientWalletAddress,
    },
  };
  const result = await dynamoDB.query(params).promise();
  return result.Items || [];
}
