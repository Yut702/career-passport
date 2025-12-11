import express from "express";
import {
  createMatch,
  getMatchesByStudent,
  getMatchesByOrg,
  getMatchById,
  updateMatchStatus,
} from "../lib/dynamo-matches.js";

const router = express.Router();

/**
 * POST /api/matches
 * マッチングを作成
 */
router.post("/", async (req, res) => {
  try {
    const { studentAddress, orgAddress, zkpProofHash } = req.body;

    if (!studentAddress || !orgAddress) {
      return res
        .status(400)
        .json({ error: "studentAddress and orgAddress are required" });
    }

    // 既にマッチングが存在するかチェック
    const existingMatches = await getMatchesByStudent(studentAddress);
    const alreadyMatched = existingMatches.some(
      (match) =>
        match.orgAddress.toLowerCase() === orgAddress.toLowerCase() &&
        match.status === "active"
    );

    if (alreadyMatched) {
      return res.status(409).json({ error: "Match already exists" });
    }

    const match = await createMatch({
      studentAddress,
      orgAddress,
      zkpProofHash,
    });

    res.status(201).json({ ok: true, match });
  } catch (err) {
    console.error("Error creating match:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/student
 * 学生のマッチング一覧を取得
 */
router.get("/student", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const matches = await getMatchesByStudent(walletAddress);
    res.json({ ok: true, matches });
  } catch (err) {
    console.error("Error getting matches:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/org
 * 企業のマッチング一覧を取得
 */
router.get("/org", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const matches = await getMatchesByOrg(walletAddress);
    res.json({ ok: true, matches });
  } catch (err) {
    console.error("Error getting matches:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/:matchId
 * マッチング詳細を取得
 */
router.get("/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await getMatchById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.json({ ok: true, match });
  } catch (err) {
    console.error("Error getting match:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/matches/:matchId/status
 * マッチングステータスを更新
 */
router.patch("/:matchId/status", async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;

    if (!["active", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await updateMatchStatus(matchId, status);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error updating match status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
