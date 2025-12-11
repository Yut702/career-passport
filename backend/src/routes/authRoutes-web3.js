import { Router } from "express";
import { verifyWallet } from "../services/authService.js";
import { getUserByWallet } from "../lib/dynamo-web3.js";

const router = Router();

/**
 * POST /api/auth/verify-wallet
 * ウォレットアドレスとメッセージ署名を検証
 */
router.post("/verify-wallet", async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res
        .status(400)
        .json({ error: "walletAddress, signature, message are required" });
    }

    // 署名を検証してトークンを生成
    const token = verifyWallet(walletAddress, signature, message);

    // ユーザー情報を取得（存在しなくても OK - 初回登録の場合）
    const user = await getUserByWallet(walletAddress);

    res.json({
      ok: true,
      token,
      user: user || { walletAddress, isNew: true },
    });
  } catch (err) {
    console.error("verify-wallet error:", err);
    res.status(401).json({ error: err.message || "Invalid signature" });
  }
});

/**
 * GET /api/auth/user-profile/:walletAddress
 * ユーザープロフィール取得
 */
router.get("/user-profile/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const user = await getUserByWallet(walletAddress);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      ok: true,
      user,
    });
  } catch (err) {
    console.error("get user-profile error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
