import { Router } from "express";
import {
  createNFT,
  getNFTsByUser,
  getNFTsByOrganization,
  getNFT,
  createNFTMetadata,
  getNFTMetadata,
  getStampsByUser,
} from "../lib/dynamo-web3.js";

const router = Router();

/**
 * POST /api/nfts/mint-from-stamps
 * スタンプ3つからNFT生成
 */
router.post("/mint-from-stamps", async (req, res) => {
  try {
    const { ownerWalletAddress, organizationAddress } = req.body;

    if (!ownerWalletAddress) {
      return res.status(400).json({ error: "ownerWalletAddress is required" });
    }

    // スタンプ数を確認
    const stamps = await getStampsByUser(ownerWalletAddress);
    if (stamps.length < 3) {
      return res.status(400).json({
        error: `Not enough stamps. Have ${stamps.length}, need 3`,
      });
    }

    // NFT ID を生成（BC側で生成されるので、ここではDBの記録用にUUIDを使用）
    const tokenId = Math.floor(Date.now() / 1000);
    const metadataUri = `${process.env.API_BASE_URL || "http://localhost:3000"}/api/nfts/metadata/${tokenId}`;

    // メタデータを保存
    const displayName = `Career Passport #${tokenId}`;
    await createNFTMetadata(
      tokenId,
      `${process.env.API_BASE_URL || "http://localhost:3000"}/assets/nft-default.png`,
      displayName,
      "Career passport NFT",
      "CareerPassport",
      "Common",
      organizationAddress ? [organizationAddress] : [],
      stamps.map((s) => s.stampId)
    );

    // NFT を保存
    const nft = await createNFT(
      tokenId,
      ownerWalletAddress,
      organizationAddress || "",
      "", // contractAddress は BC デプロイ後に更新
      metadataUri,
      Math.floor(Date.now() / 1000), // Unix timestamp
      "" // transactionHash は BC トランザクション後に更新
    );

    res.status(201).json({
      ok: true,
      nft,
      metadataUri,
      next: "Call CareerPassportNFT.mint on blockchain",
    });
  } catch (err) {
    console.error("mint NFT error:", err);
    res.status(500).json({ error: "Failed to mint NFT" });
  }
});

/**
 * GET /api/nfts/user/:walletAddress
 * ユーザーのNFT一覧取得
 */
router.get("/user/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const nfts = await getNFTsByUser(walletAddress);

    // メタデータを結合
    const nftsWithMetadata = await Promise.all(
      nfts.map(async (nft) => {
        const metadata = await getNFTMetadata(nft.tokenId);
        return {
          ...nft,
          ...metadata,
        };
      })
    );

    res.json({
      ok: true,
      nfts: nftsWithMetadata,
    });
  } catch (err) {
    console.error("get NFTs error:", err);
    res.status(500).json({ error: "Failed to get NFTs" });
  }
});

/**
 * GET /api/nfts/organization/:organizationAddress
 * 企業が発行したNFT一覧取得
 */
router.get("/organization/:organizationAddress", async (req, res) => {
  try {
    const { organizationAddress } = req.params;

    const nfts = await getNFTsByOrganization(organizationAddress);

    res.json({
      ok: true,
      nfts,
    });
  } catch (err) {
    console.error("get org NFTs error:", err);
    res.status(500).json({ error: "Failed to get NFTs" });
  }
});

/**
 * GET /api/nfts/metadata/:tokenId
 * NFTメタデータ取得（metadataUri で参照される）
 */
router.get("/metadata/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;

    const metadata = await getNFTMetadata(parseInt(tokenId, 10));

    if (!metadata) {
      return res.status(404).json({ error: "NFT metadata not found" });
    }

    res.json({
      ok: true,
      metadata,
    });
  } catch (err) {
    console.error("get NFT metadata error:", err);
    res.status(500).json({ error: "Failed to get NFT metadata" });
  }
});

/**
 * GET /api/nfts/:tokenId
 * NFT詳細取得
 */
router.get("/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;

    const nft = await getNFT(parseInt(tokenId, 10));
    const metadata = await getNFTMetadata(parseInt(tokenId, 10));

    if (!nft) {
      return res.status(404).json({ error: "NFT not found" });
    }

    res.json({
      ok: true,
      nft: {
        ...nft,
        ...metadata,
      },
    });
  } catch (err) {
    console.error("get NFT error:", err);
    res.status(500).json({ error: "Failed to get NFT" });
  }
});

export default router;
