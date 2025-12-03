import { getUserByEmail as libGetUserByEmail, putUser as libPutUser } from "../lib/dynamo.js";

const TABLE = process.env.DYNAMODB_TABLE_USERS || "CareerPassportUsers";

export const getUserByEmail = async (email) => {
  return await libGetUserByEmail(TABLE, email);
};

export const upsertUserProfile = async (email, profile) => {
  const Item = {
    email,
    ...profile,
  };
  await libPutUser(TABLE, Item);
  return Item;
};
