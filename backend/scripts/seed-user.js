import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { putUser } from "../src/lib/dynamo.js";
dotenv.config();

const TABLE = process.env.DYNAMODB_TABLE_USERS || "NonFungibleCareerUsers";
const email = process.env.SEED_EMAIL || "org@example.com";
const password = process.env.SEED_PASSWORD || "password123";
const name = process.env.SEED_NAME || "Org Admin";

async function seed() {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      email,
      passwordHash,
      name,
      role: "org",
      createdAt: new Date().toISOString(),
    };
    await putUser(TABLE, user);
    console.log("Seeded user:", email);
  } catch (err) {
    console.error("seed error", err);
    process.exit(1);
  }
}

seed();
