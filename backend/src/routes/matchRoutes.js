import express from "express";
import {
  createMatch,
  getMatchesByStudent,
  getMatchesByOrg,
  getMatchById,
  updateMatchStatus,
} from "../lib/dynamo-matches.js";
import {
  getJobConditionByWallet,
  getRecruitmentConditionByOrg,
  getAllJobConditions,
  getAllRecruitmentConditions,
} from "../lib/dynamo-job-conditions.js";
import { createMessage } from "../lib/dynamo-messages.js";

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

    // マッチング作成成功後、自動的に学生から企業への初期メッセージを送信
    try {
      const initialMessage = `マッチングが成立しました。よろしくお願いします。`;
      await createMessage({
        senderAddress: studentAddress,
        receiverAddress: orgAddress,
        content: initialMessage,
      });
      console.log(
        `✅ マッチング作成時の自動メッセージ送信成功: ${studentAddress} -> ${orgAddress}`
      );
    } catch (messageError) {
      // メッセージ送信に失敗してもマッチング作成は成功とする
      console.error(
        "⚠️ マッチング作成時の自動メッセージ送信に失敗しました:",
        messageError
      );
    }

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

/**
 * GET /api/matches/search/student
 * 学生側から見たマッチング候補を検索
 * カテゴリが一致すればマッチング候補として返す（緩い条件）
 */
router.get("/search/student", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    // 学生の求人条件を取得
    const studentCondition = await getJobConditionByWallet(walletAddress);
    if (!studentCondition || !studentCondition.positionCategory) {
      return res.json({ ok: true, candidates: [] });
    }

    // 既存のマッチングを取得（重複を避けるため）
    const existingMatches = await getMatchesByStudent(walletAddress);
    const matchedOrgAddresses = new Set(
      existingMatches
        .filter((m) => m.status === "active")
        .map((m) => m.orgAddress.toLowerCase())
    );

    // 全企業の採用条件を取得
    const allRecruitmentConditions = await getAllRecruitmentConditions();

    // マッチング候補をフィルタリング
    // カテゴリが一致すればマッチング候補とする（緩い条件）
    const candidates = allRecruitmentConditions
      .filter((orgCondition) => {
        // 既にマッチング済みの企業は除外
        if (matchedOrgAddresses.has(orgCondition.orgAddress.toLowerCase())) {
          return false;
        }

        // カテゴリが一致するかチェック
        if (
          orgCondition.positionCategory &&
          studentCondition.positionCategory &&
          orgCondition.positionCategory === studentCondition.positionCategory
        ) {
          return true;
        }

        return false;
      })
      .map((orgCondition) => ({
        orgAddress: orgCondition.orgAddress,
        condition: orgCondition,
        matchScore: 100, // カテゴリが一致すれば100%とする
      }));

    res.json({ ok: true, candidates });
  } catch (err) {
    console.error("Error searching matches for student:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/search/org
 * 企業側から見たマッチング候補を検索
 * カテゴリが一致すればマッチング候補として返す（緩い条件）
 */
router.get("/search/org", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    // 企業の採用条件を取得
    const orgCondition = await getRecruitmentConditionByOrg(walletAddress);
    if (!orgCondition || !orgCondition.positionCategory) {
      return res.json({ ok: true, candidates: [] });
    }

    // 既存のマッチングを取得（重複を避けるため）
    const existingMatches = await getMatchesByOrg(walletAddress);
    const matchedStudentAddresses = new Set(
      existingMatches
        .filter((m) => m.status === "active")
        .map((m) => m.studentAddress.toLowerCase())
    );

    // 全学生の求人条件を取得
    const allJobConditions = await getAllJobConditions();

    // マッチング候補をフィルタリング
    // カテゴリが一致すればマッチング候補とする（緩い条件）
    const candidates = allJobConditions
      .filter((studentCondition) => {
        // 既にマッチング済みの学生は除外
        if (
          matchedStudentAddresses.has(
            studentCondition.walletAddress.toLowerCase()
          )
        ) {
          return false;
        }

        // カテゴリが一致するかチェック
        if (
          studentCondition.positionCategory &&
          orgCondition.positionCategory &&
          studentCondition.positionCategory === orgCondition.positionCategory
        ) {
          return true;
        }

        return false;
      })
      .map((studentCondition) => ({
        studentAddress: studentCondition.walletAddress,
        condition: studentCondition,
        matchScore: 100, // カテゴリが一致すれば100%とする
      }));

    res.json({ ok: true, candidates });
  } catch (err) {
    console.error("Error searching matches for org:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
