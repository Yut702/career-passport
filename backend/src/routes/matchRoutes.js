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

    // ウォレットアドレスを送信してマッチングを作成
    const match = await createMatch({
      studentAddress,
      orgAddress,
      zkpProofHash,
    });

    // マッチング作成成功後、自動的に企業から学生への初期メッセージを送信
    // これにより、双方でメッセージタブでやり取りできるようになる
    // メッセージの宛先は、マッチングに紐づくstudentAddressを使用
    try {
      const initialMessage = `マッチングが成立しました。よろしくお願いします。`;
      await createMessage({
        senderAddress: orgAddress, // 企業側から送信
        receiverAddress: studentAddress, // 学生側へ送信（マッチングに紐づくウォレットアドレス）
        content: initialMessage,
      });
    } catch (messageError) {
      // メッセージ送信に失敗してもマッチング作成は成功とする
      console.error(
        "Error sending initial message after match creation:",
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
 * 条件を緩和：採用条件が設定されている企業は全て候補として表示
 */
router.get("/search/student", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    // 学生の求人条件を取得（オプション）
    const studentCondition = await getJobConditionByWallet(walletAddress);

    // 既存のマッチングを取得（重複を避けるため）
    const existingMatches = await getMatchesByStudent(walletAddress);

    // 既存のマッチングがログインユーザーのものか確認
    const validMatches = existingMatches.filter(
      (m) => m.studentAddress?.toLowerCase() === walletAddress?.toLowerCase()
    );

    const matchedOrgAddresses = new Set(
      validMatches
        .filter((m) => m.status === "active")
        .map((m) => m.orgAddress.toLowerCase())
    );

    // 全企業の採用条件を取得
    const allRecruitmentConditions = await getAllRecruitmentConditions();

    // マッチング候補をフィルタリング
    // 採用条件が設定されている企業は全て候補として表示（条件を大幅に緩和）
    const candidates = allRecruitmentConditions
      .filter((orgCondition) => {
        // 既にマッチング済みの企業は除外
        if (matchedOrgAddresses.has(orgCondition.orgAddress.toLowerCase())) {
          return false;
        }

        // 採用条件が設定されていれば候補とする（条件を緩和）
        // orgAddressが存在すれば採用条件が設定されているとみなす
        if (orgCondition.orgAddress) {
          return true;
        }

        return false;
      })
      .map((orgCondition) => {
        // マッチングスコアを計算（カテゴリが一致する場合は100%、不一致でも50%）
        let matchScore = 50; // デフォルトスコア
        if (
          studentCondition?.positionCategory &&
          orgCondition.positionCategory &&
          studentCondition.positionCategory === orgCondition.positionCategory
        ) {
          matchScore = 100; // カテゴリが一致する場合は100%
        }

        return {
          orgAddress: orgCondition.orgAddress,
          condition: orgCondition,
          matchScore: matchScore,
        };
      });

    res.json({ ok: true, candidates });
  } catch (err) {
    console.error("Error searching matches for student:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/search/org
 * 企業側から見たマッチング候補を検索
 * 条件を緩和：求人条件が設定されている学生は全て候補として表示
 */
router.get("/search/org", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    // 企業の採用条件を取得（オプション）
    const orgCondition = await getRecruitmentConditionByOrg(walletAddress);

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
    // 求人条件が設定されている学生は全て候補として表示（条件を大幅に緩和）
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

        // 求人条件が設定されていれば候補とする（条件を緩和）
        // walletAddressが存在すれば求人条件が設定されているとみなす
        if (studentCondition.walletAddress) {
          return true;
        }

        return false;
      })
      .map((studentCondition) => {
        // マッチングスコアを計算（カテゴリが一致する場合は100%、不一致でも50%）
        let matchScore = 50; // デフォルトスコア
        if (
          orgCondition?.positionCategory &&
          studentCondition.positionCategory &&
          studentCondition.positionCategory === orgCondition.positionCategory
        ) {
          matchScore = 100; // カテゴリが一致する場合は100%
        }

        return {
          studentAddress: studentCondition.walletAddress,
          condition: studentCondition,
          matchScore: matchScore,
        };
      });

    res.json({ ok: true, candidates });
  } catch (err) {
    console.error("Error searching matches for org:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
