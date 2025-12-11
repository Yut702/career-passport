import { Router } from "express";
import {
  createEvent,
  getEvent,
  getEventsByOrganization,
  getEventsByStatus,
  updateEvent,
  addEventParticipant,
  getEventParticipants,
  updateEventParticipant,
} from "../lib/dynamo-web3.js";

const router = Router();

/**
 * POST /api/events
 * イベント作成
 */
router.post("/", async (req, res) => {
  try {
    const {
      eventId,
      organizationAddress,
      eventName,
      eventDescription,
      eventDate,
      location,
      imageUrl,
      maxParticipants,
    } = req.body;

    if (
      !eventId ||
      !organizationAddress ||
      !eventName ||
      !eventDate ||
      !location
    ) {
      return res.status(400).json({
        error:
          "eventId, organizationAddress, eventName, eventDate, location are required",
      });
    }

    const event = await createEvent(
      eventId,
      organizationAddress,
      eventName,
      eventDescription || "",
      eventDate,
      location,
      imageUrl || "",
      maxParticipants || 50,
      "planning"
    );

    res.status(201).json({
      ok: true,
      event,
    });
  } catch (err) {
    console.error("create event error:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

/**
 * GET /api/events
 * イベント一覧取得（ステータスでフィルタ可能）
 */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let events;
    if (status) {
      events = await getEventsByStatus(status);
    } else {
      // ステータスでフィルタしない場合は、planning と ongoing を取得
      const planningEvents = await getEventsByStatus("planning");
      const ongoingEvents = await getEventsByStatus("ongoing");
      events = [...ongoingEvents, ...planningEvents];
    }

    res.json({
      ok: true,
      events,
    });
  } catch (err) {
    console.error("get events error:", err);
    res.status(500).json({ error: "Failed to get events" });
  }
});

/**
 * GET /api/events/organization/:organizationAddress
 * 企業のイベント一覧取得
 */
router.get("/organization/:organizationAddress", async (req, res) => {
  try {
    const { organizationAddress } = req.params;

    const events = await getEventsByOrganization(organizationAddress);

    res.json({
      ok: true,
      events,
    });
  } catch (err) {
    console.error("get org events error:", err);
    res.status(500).json({ error: "Failed to get events" });
  }
});

/**
 * GET /api/events/:eventId
 * イベント詳細取得
 */
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await getEvent(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      ok: true,
      event,
    });
  } catch (err) {
    console.error("get event error:", err);
    res.status(500).json({ error: "Failed to get event" });
  }
});

/**
 * PUT /api/events/:eventId
 * イベント更新
 */
router.put("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await updateEvent(eventId, updates);

    res.json({
      ok: true,
      event,
    });
  } catch (err) {
    console.error("update event error:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

/**
 * POST /api/events/:eventId/participant-joined
 * 参加者追加
 */
router.post("/:eventId/participant-joined", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantWalletAddress } = req.body;

    if (!participantWalletAddress) {
      return res
        .status(400)
        .json({ error: "participantWalletAddress is required" });
    }

    const event = await getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.currentParticipants >= event.maxParticipants) {
      return res
        .status(400)
        .json({ error: "Event is full - no more participants can join" });
    }

    const participant = await addEventParticipant(
      eventId,
      participantWalletAddress,
      "registered"
    );

    res.status(201).json({
      ok: true,
      participant,
    });
  } catch (err) {
    console.error("add participant error:", err);
    res.status(500).json({ error: "Failed to add participant" });
  }
});

/**
 * GET /api/events/:eventId/participants
 * イベント参加者一覧取得
 */
router.get("/:eventId/participants", async (req, res) => {
  try {
    const { eventId } = req.params;

    const participants = await getEventParticipants(eventId);

    res.json({
      ok: true,
      participants,
    });
  } catch (err) {
    console.error("get event participants error:", err);
    res.status(500).json({ error: "Failed to get participants" });
  }
});

/**
 * PUT /api/events/:eventId/participants/:participantAddress
 * 参加者ステータス更新（attended → stamp授与準備）
 */
router.put("/:eventId/participants/:participantAddress", async (req, res) => {
  try {
    const { eventId, participantAddress } = req.params;
    const { status, stampAwarded } = req.body;

    const participant = await updateEventParticipant(
      eventId,
      participantAddress,
      { status, stampAwarded }
    );

    res.json({
      ok: true,
      participant,
    });
  } catch (err) {
    console.error("update participant error:", err);
    res.status(500).json({ error: "Failed to update participant" });
  }
});

export default router;
