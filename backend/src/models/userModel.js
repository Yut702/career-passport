import { getUserByEmail as libGetUserByEmail } from "../lib/dynamo.js";

const TABLE = process.env.DYNAMODB_TABLE_USERS || "CareerPassportUsers";

export const getUserByEmail = async (email) => {
  return await libGetUserByEmail(TABLE, email);
};
