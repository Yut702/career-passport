import express from "express";
import {
  createApplication,
  getApplicationsByEvent,
  getApplicationsByWallet,
  getApplicationById,
  updateApplicationStatus,
} from "../lib/dynamo-events.js";
import {
  createEvent,
  getEventById,
  getEventsByOrg,
  getAllEvents,
  updateEvent,
  deleteEvent,
} from "../lib/dynamo-events-data.js";

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
    let existingApplications;
    try {
      existingApplications = await getApplicationsByWallet(
        walletAddress.toLowerCase()
      );
    } catch (err) {
      console.error("Error checking existing applications:", err);
      // ResourceNotFoundExceptionの場合は空配列を返す（テーブルが存在しない場合）
      if (err.code === "ResourceNotFoundException") {
        existingApplications = [];
      } else {
        // その他のエラーも無視して続行（新規応募として処理）
        existingApplications = [];
      }
    }

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

    // DynamoDBのテーブルが存在しない場合の処理
    if (err.code === "ResourceNotFoundException") {
      const errorMessage =
        process.env.NODE_ENV === "development"
          ? "DynamoDBテーブルが存在しません。テーブルを作成してください: node backend/scripts/create-api-tables.js"
          : "データベースが設定されていません。管理者に連絡してください。";
      return res.status(503).json({ error: errorMessage });
    }

    const errorMessage =
      process.env.NODE_ENV === "development"
        ? err.message || "Internal server error"
        : "Internal server error";
    res.status(500).json({ error: errorMessage });
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
    // DynamoDBのエラーの場合、空配列を返す（エラーを無視して続行）
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn("DynamoDB table or index not found, returning empty array");
      return res.json({ ok: true, applications: [] });
    }
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? err.message || "Internal server error"
        : "Internal server error";
    res.status(500).json({ error: errorMessage });
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
    // DynamoDBのエラーの場合、空配列を返す（エラーを無視して続行）
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn("DynamoDB table or index not found, returning empty array");
      return res.json({ ok: true, applications: [] });
    }
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? err.message || "Internal server error"
        : "Internal server error";
    res.status(500).json({ error: errorMessage });
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

/**
 * POST /api/events
 * イベントを作成（企業向け）
 */
router.post("/", async (req, res) => {
  try {
    const {
      orgWalletAddress,
      title,
      description,
      startDate,
      endDate,
      location,
      maxParticipants,
      status,
    } = req.body;

    if (!orgWalletAddress || !title || !startDate || !endDate) {
      return res.status(400).json({
        error: "orgWalletAddress, title, startDate, and endDate are required",
      });
    }

    const event = await createEvent({
      orgWalletAddress,
      title,
      description,
      startDate,
      endDate,
      location,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      status,
    });

    res.status(201).json({ ok: true, event });
  } catch (err) {
    console.error("Error creating event:", err);
    if (err.code === "ResourceNotFoundException") {
      const errorMessage =
        process.env.NODE_ENV === "development"
          ? "DynamoDBテーブルが存在しません。テーブルを作成してください: node backend/scripts/create-api-tables.js"
          : "データベースが設定されていません。管理者に連絡してください。";
      return res.status(503).json({ error: errorMessage });
    }
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? err.message || "Internal server error"
        : "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/events
 * イベント一覧を取得
 */
router.get("/", async (req, res) => {
  try {
    const { orgWalletAddress } = req.query;
    let events;

    if (orgWalletAddress) {
      // 企業のイベント一覧を取得
      events = await getEventsByOrg(orgWalletAddress);
    } else {
      // 全イベント一覧を取得
      events = await getAllEvents();
    }

    res.json({ ok: true, events });
  } catch (err) {
    console.error("Error getting events:", err);
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      console.warn("DynamoDB table or index not found, returning empty array");
      return res.json({ ok: true, events: [] });
    }
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? err.message || "Internal server error"
        : "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/events/:eventId
 * イベント詳細を取得
 */
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await getEventById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ ok: true, event });
  } catch (err) {
    console.error("Error getting event:", err);
    if (err.code === "ResourceNotFoundException") {
      return res.status(404).json({ error: "Event not found" });
    }
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? err.message || "Internal server error"
        : "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * PATCH /api/events/:eventId
 * イベントを更新（企業向け）
 */
router.patch("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    // 更新可能なフィールドのみを抽出
    const allowedFields = [
      "title",
      "description",
      "startDate",
      "endDate",
      "location",
      "maxParticipants",
      "status",
    ];
    const filteredUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await updateEvent(eventId, filteredUpdates);
    const updatedEvent = await getEventById(eventId);
    res.json({ ok: true, event: updatedEvent });
  } catch (err) {
    console.error("Error updating event:", err);
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? err.message || "Internal server error"
        : "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * DELETE /api/events/:eventId
 * イベントを削除（企業向け）
 */
router.delete("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    await deleteEvent(eventId);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting event:", err);
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? err.message || "Internal server error"
        : "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
