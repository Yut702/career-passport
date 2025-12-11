import express from "express";
import {
  createApplication,
  getApplicationsByEvent,
  getApplicationsByWallet,
  getApplicationById,
  updateApplicationStatus,
} from "../lib/dynamo-events.js";

const router = express.Router();

/**
 * POST /api/events/:eventId/apply
 * イベントに応募
 */
router.post("/:eventId/apply", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { walletAddress, applicationText } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    // 既に応募しているかチェック
    const existingApplications = await getApplicationsByWallet(
      walletAddress.toLowerCase()
    );
    const alreadyApplied = existingApplications.some(
      (app) => app.eventId === eventId
    );

    if (alreadyApplied) {
      return res.status(409).json({ error: "Already applied to this event" });
    }

    const application = await createApplication({
      eventId,
      walletAddress,
      applicationText: applicationText || "",
    });

    res.status(201).json({ ok: true, application });
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/events/:eventId/applications
 * イベントの応募一覧を取得（企業向け）
 */
router.get("/:eventId/applications", async (req, res) => {
  try {
    const { eventId } = req.params;
    const applications = await getApplicationsByEvent(eventId);
    res.json({ ok: true, applications });
  } catch (err) {
    console.error("Error getting applications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/events/applications
 * 自分の応募一覧を取得（ユーザー向け）
 */
router.get("/applications", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const applications = await getApplicationsByWallet(walletAddress);
    res.json({ ok: true, applications });
  } catch (err) {
    console.error("Error getting applications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/events/applications/:applicationId/status
 * 応募ステータスを更新（企業向け）
 */
router.patch("/applications/:applicationId/status", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await updateApplicationStatus(applicationId, status);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error updating application status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
