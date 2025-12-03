import bcrypt from "bcrypt";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT,
});

const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.DYNAMODB_TABLE_USERS;

// -------------------------------
// Register
// -------------------------------
export async function register(email, password) {
  // 既存確認
  const existing = await findByEmail(email);
  if (existing) throw new Error("User already exists");

  // ハッシュ作成
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        email,
        passwordHash,
        firstName: null,
        lastName: null,
        gender: null,
        dob: null,
        age: null,
      },
      ConditionExpression: "attribute_not_exists(email)",
    })
  );

  return { email };
}

// -------------------------------
// Login
// -------------------------------
export async function login(email, password) {
  const usr = await findByEmail(email);
  if (!usr) throw new Error("User not found");

  const ok = await bcrypt.compare(password, usr.passwordHash);
  if (!ok) throw new Error("Invalid password");

  return usr;
}

// -------------------------------
// Save profile
// -------------------------------
export async function saveProfile(email, profile) {
  // profile: { firstName, lastName, dob, gender, age }

  const params = {
    TableName: TABLE,
    Key: { email },
    UpdateExpression:
      "SET firstName = :fn, lastName = :ln, dob = :dob, gender = :gender, age = :age",
    ExpressionAttributeValues: {
      ":fn": profile.firstName ?? null,
      ":ln": profile.lastName ?? null,
      ":dob": profile.dob ?? null,
      ":gender": profile.gender ?? null,
      ":age": profile.age ?? null,
    },
    ReturnValues: "ALL_NEW",
  };

  const res = await ddb.send(new UpdateCommand(params));
  return res.Attributes;
}

// -------------------------------
// Get Me
// -------------------------------
export async function getMe(email) {
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { email },
    })
  );
  return res.Item;
}

// -------------------------------
// Helper
// -------------------------------
async function findByEmail(email) {
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { email },
    })
  );
  return res.Item || null;
}

export default { register, login, saveProfile, getMe };
