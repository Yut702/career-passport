import jwt from "jsonwebtoken";

const SECRET = "demo-secret"; // 本番では環境変数にする

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: "24h" });
};
