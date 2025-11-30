import AWS from "aws-sdk";

AWS.config.update({
  region: "ap-northeast-1",
});

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE = "Users";

export const getUserByEmail = async (email) => {
  const params = {
    TableName: TABLE,
    IndexName: "EmailIndex", // GSIで email を検索できるように設定する
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  const result = await dynamo.query(params).promise();
  return result.Items[0];
};
