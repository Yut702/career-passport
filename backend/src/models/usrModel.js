// usrModel.js
import { 
  getUserByEmail as libGetUserByEmail, 
  updateUserProfile as libUpdateUserProfile 
} from "../lib/dynamo.js";

const TABLE = process.env.DYNAMODB_TABLE_USERS || "CareerPassportUsers";

/**
 * email でユーザー取得
 */
export const getUserByEmail = async (email) => {
  return await libGetUserByEmail(TABLE, email);
};

/**
 * プロフィールの部分更新（passwordHashは保持される）
 */
export const upsertUserProfile = async (email, profile) => {
  return await libUpdateUserProfile(TABLE, email, profile);
};
