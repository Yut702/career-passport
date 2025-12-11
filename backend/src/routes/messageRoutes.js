import express from "express";
import {
  createMessage,
  getMessagesByConversation,
  getConversations,
  markMessageAsRead,
} from "../lib/dynamo-messages.js";

const router = express.Router();

/**
 * POST /api/messages
 * メッセージを送信
 */
router.post("/", async (req, res) => {
  try {
    const { senderAddress, receiverAddress, content } = req.body;

    if (!senderAddress || !receiverAddress) {
      return res
        .status(400)
        .json({ error: "senderAddress and receiverAddress are required" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "content is required" });
    }

    const message = await createMessage({
      senderAddress,
      receiverAddress,
      content: content.trim(),
    });

    res.status(201).json({ ok: true, message });
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/messages/conversations
 * 会話一覧を取得
 */
router.get("/conversations", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const conversations = await getConversations(walletAddress);
    res.json({ ok: true, conversations });
  } catch (err) {
    console.error("Error getting conversations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/messages/conversations/:conversationId
 * 会話のメッセージ一覧を取得
 */
router.get("/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await getMessagesByConversation(conversationId);
    res.json({ ok: true, messages });
  } catch (err) {
    console.error("Error getting messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/messages/:messageId/read
 * メッセージを既読にする
 */
router.patch("/:messageId/read", async (req, res) => {
  try {
    const { messageId } = req.params;
    await markMessageAsRead(messageId);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error marking message as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
