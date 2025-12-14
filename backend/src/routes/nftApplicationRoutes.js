import express from "express";
import {
  createNFTApplication,
  getNFTApplicationById,
  getNFTApplicationsByOrg,
  getNFTApplicationsByUser,
  updateNFTApplication,
  deleteNFTApplication,
} from "../lib/dynamo-nft-applications.js";

const router = express.Router();

/**
 * POST /api/nft-applications
 * NFT申請を作成
 */
router.post("/", async (req, res) => {
  try {
    const { userWalletAddress, orgWalletAddress, organization, stampCount } =
      req.body;

    if (!userWalletAddress || !orgWalletAddress || !organization) {
      return res.status(400).json({
        error:
          "userWalletAddress, orgWalletAddress, and organization are required",
      });
    }

    // 既に申請があるかチェック（pendingまたはapproved状態）
    const existingApplications = await getNFTApplicationsByUser(
      userWalletAddress.toLowerCase()
    );
    const hasPendingApplication = existingApplications.some(
      (app) =>
        app.orgWalletAddress.toLowerCase() === orgWalletAddress.toLowerCase() &&
        app.organization === organization &&
        (app.status === "pending" || app.status === "approved")
    );

    if (hasPendingApplication) {
      return res.status(400).json({
        error: "既に申請済みです",
      });
    }

    const application = await createNFTApplication({
      userWalletAddress,
      orgWalletAddress,
      organization,
      stampCount: stampCount || 0,
    });

    res.json(application);
  } catch (error) {
    console.error("Error creating NFT application:", error);
    res.status(500).json({ error: "Failed to create NFT application" });
  }
});

/**
 * GET /api/nft-applications/user/:walletAddress
 * ユーザーの申請一覧を取得
 */
router.get("/user/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const applications = await getNFTApplicationsByUser(walletAddress);
    res.json(applications);
  } catch (error) {
    console.error("Error getting NFT applications:", error);
    res.status(500).json({ error: "Failed to get NFT applications" });
  }
});

/**
 * GET /api/nft-applications/org/:walletAddress
 * 企業の申請一覧を取得
 */
router.get("/org/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const applications = await getNFTApplicationsByOrg(walletAddress);
    res.json(applications);
  } catch (error) {
    console.error("Error getting NFT applications:", error);
    res.status(500).json({ error: "Failed to get NFT applications" });
  }
});

/**
 * GET /api/nft-applications/:applicationId
 * 申請詳細を取得
 */
router.get("/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await getNFTApplicationById(applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json(application);
  } catch (error) {
    console.error("Error getting NFT application:", error);
    res.status(500).json({ error: "Failed to get NFT application" });
  }
});

/**
 * PATCH /api/nft-applications/:applicationId
 * 申請を更新（ステータス変更など）
 */
router.patch("/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const updates = req.body;

    // statusのみ更新可能（セキュリティのため）
    const allowedFields = ["status"];
    const filteredUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updatedApplication = await updateNFTApplication(
      applicationId,
      filteredUpdates
    );
    res.json(updatedApplication);
  } catch (error) {
    console.error("Error updating NFT application:", error);
    res.status(500).json({ error: "Failed to update NFT application" });
  }
});

/**
 * DELETE /api/nft-applications/:applicationId
 * 申請を削除
 */
router.delete("/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    await deleteNFTApplication(applicationId);
    res.json({ message: "Application deleted" });
  } catch (error) {
    console.error("Error deleting NFT application:", error);
    res.status(500).json({ error: "Failed to delete NFT application" });
  }
});

export default router;
