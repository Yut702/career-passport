import { Router } from "express";
import {
  createStamp,
  getStampsByUser,
  getStampsByOrganization,
  getStamp,
  createStampMetadata,
  getStampMetadata,
} from "../lib/dynamo-web3.js";

const router = Router();

/**
 * POST /api/stamps/issue
 * スタンプ発行（DB保存 + metadataUri生成）
 */
router.post("/issue", async (req, res) => {
  try {
    const {
      userWalletAddress,
      organizationAddress,
      category,
      imageUrl,
      description,
      certificateCategory,
      issuerName,
      issuedDate,
    } = req.body;

    if (!userWalletAddress || !organizationAddress || !category) {
      return res.status(400).json({
        error:
          "userWalletAddress, organizationAddress, category are required",
      });
    }

    // stampId 生成（BC側で生成されるので、ここではDBの記録用にUUIDを使用）
    const stampId = `stamp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // metadataUri 生成
    const metadataUri = `${process.env.API_BASE_URL || "http://localhost:3000"}/api/stamps/metadata/${stampId}`;

    // メタデータを保存
    await createStampMetadata(
      stampId,
      imageUrl,
      description,
      certificateCategory || category,
      issuerName || "",
      issuedDate || new Date().toISOString()
    );

    // スタンプを保存（タイムスタンプはBC側と同期する際に更新）
    const stamp = await createStamp(
      stampId,
      userWalletAddress,
      organizationAddress,
      category,
      metadataUri,
      Math.floor(Date.now() / 1000) // Unix timestamp
    );

    res.status(201).json({
      ok: true,
      stamp,
      metadataUri,
      next: "Call StampManager.issueStamp on blockchain",
    });
  } catch (err) {
    console.error("issue stamp error:", err);
    res.status(500).json({ error: "Failed to issue stamp" });
  }
});

/**
 * GET /api/stamps/user/:walletAddress
 * ユーザーのスタンプ一覧取得
 */
router.get("/user/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const stamps = await getStampsByUser(walletAddress);

    // メタデータを結合
    const stampsWithMetadata = await Promise.all(
      stamps.map(async (stamp) => {
        const metadata = await getStampMetadata(stamp.stampId);
        return {
          ...stamp,
          ...metadata,
        };
      })
    );

    res.json({
      ok: true,
      stamps: stampsWithMetadata,
    });
  } catch (err) {
    console.error("get stamps error:", err);
    res.status(500).json({ error: "Failed to get stamps" });
  }
});

/**
 * GET /api/stamps/organization/:organizationAddress
 * 企業が発行したスタンプ一覧取得
 */
router.get("/organization/:organizationAddress", async (req, res) => {
  try {
    const { organizationAddress } = req.params;

    const stamps = await getStampsByOrganization(organizationAddress);

    res.json({
      ok: true,
      stamps,
    });
  } catch (err) {
    console.error("get org stamps error:", err);
    res.status(500).json({ error: "Failed to get stamps" });
  }
});

/**
 * GET /api/stamps/metadata/:stampId
 * スタンプメタデータ取得（metadataUri で参照される）
 */
router.get("/metadata/:stampId", async (req, res) => {
  try {
    const { stampId } = req.params;

    const metadata = await getStampMetadata(stampId);

    if (!metadata) {
      return res.status(404).json({ error: "Stamp metadata not found" });
    }

    res.json({
      ok: true,
      metadata,
    });
  } catch (err) {
    console.error("get stamp metadata error:", err);
    res.status(500).json({ error: "Failed to get stamp metadata" });
  }
});

/**
 * GET /api/stamps/:stampId
 * スタンプ詳細取得
 */
router.get("/:stampId", async (req, res) => {
  try {
    const { stampId } = req.params;

    const stamp = await getStamp(stampId);
    const metadata = await getStampMetadata(stampId);

    if (!stamp) {
      return res.status(404).json({ error: "Stamp not found" });
    }

    res.json({
      ok: true,
      stamp: {
        ...stamp,
        ...metadata,
      },
    });
  } catch (err) {
    console.error("get stamp error:", err);
    res.status(500).json({ error: "Failed to get stamp" });
  }
});

export default router;
