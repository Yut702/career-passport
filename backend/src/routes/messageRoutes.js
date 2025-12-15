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

    // 会話に相手の情報を追加（Fromアドレスを明確に表示するため）
    const conversationsWithOtherInfo = conversations.map((conv) => ({
      ...conv,
      otherInfo: {
        walletAddress: conv.otherAddress,
        // 将来的にユーザープロファイル情報を追加可能
        // displayName: userProfile?.name || formatAddress(conv.otherAddress),
        // userType: userProfile?.type || "unknown",
      },
    }));

    res.json({ ok: true, conversations: conversationsWithOtherInfo });
  } catch (err) {
    console.error("Error getting conversations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/messages/conversations/:conversationId
 * 会話のメッセージ一覧を取得
 * ログインしているアドレス（walletAddress）が送信者または受信者であるメッセージのみを返す
 */
router.get("/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const messages = await getMessagesByConversation(conversationId);
    const address = walletAddress.toLowerCase();

    // ログインしているアドレスが送信者または受信者であるメッセージのみをフィルタリング
    const filteredMessages = messages.filter(
      (msg) =>
        msg.senderAddress.toLowerCase() === address ||
        msg.receiverAddress.toLowerCase() === address
    );

    // メッセージに送信者情報を追加（Fromアドレスを明確に表示するため）
    const messagesWithSenderInfo = filteredMessages.map((msg) => ({
      ...msg,
      senderInfo: {
        walletAddress: msg.senderAddress,
        // 将来的にユーザープロファイル情報を追加可能
        // displayName: userProfile?.name || formatAddress(msg.senderAddress),
        // userType: userProfile?.type || "unknown",
      },
    }));

    res.json({ ok: true, messages: messagesWithSenderInfo });
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
