import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * ウォレット署名を検証
 * @param {string} walletAddress - ウォレットアドレス
 * @param {string} signature - 署名（0xで始まる16進数）
 * @param {string} message - 署名元のメッセージ
 * @returns {string} JWT トークン
 */
export function verifyWallet(walletAddress, signature, message) {
  try {
    // 署名からアドレスを復元
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // 大文字小文字を正規化してチェック
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error("Signature verification failed");
    }

    // JWT トークン生成
    const token = jwt.sign(
      {
        sub: walletAddress,
        type: "wallet",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return token;
  } catch (err) {
    throw new Error(`Wallet verification failed: ${err.message}`);
  }
}

/**
 * JWT トークンを検証
 * @param {string} token - JWT トークン
 * @returns {object} デコード済みペイロード
 */
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    throw new Error(`Token verification failed: ${err.message}`);
  }
}

/**
 * メッセージ署名用のメッセージを生成
 * @param {string} walletAddress - ウォレットアドレス
 * @returns {string} メッセージ
 */
export function generateAuthMessage(walletAddress) {
  const timestamp = new Date().toISOString();
  return `Sign this message to authenticate your wallet:\n\nAddress: ${walletAddress}\nTimestamp: ${timestamp}\n\nThis signature will only be used for authentication and does not authorize any transactions.`;
}
