import express from "express";
import {
  saveJobCondition,
  getJobConditionByWallet,
  saveRecruitmentCondition,
  getRecruitmentConditionByOrg,
} from "../lib/dynamo-job-conditions.js";

const router = express.Router();

/**
 * POST /api/job-conditions
 * 学生側の求人条件を保存
 */
router.post("/", async (req, res) => {
  try {
    const { walletAddress, ...conditionData } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const condition = await saveJobCondition(walletAddress, conditionData);
    res.json({ ok: true, condition });
  } catch (err) {
    console.error("Error saving job condition:", err);
    const errorMessage = err.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/job-conditions
 * 学生側の求人条件を取得
 */
router.get("/", async (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const condition = await getJobConditionByWallet(walletAddress);
    if (!condition) {
      return res.json({ ok: true, condition: null });
    }

    res.json({ ok: true, condition });
  } catch (err) {
    console.error("Error getting job condition:", err);
    // テーブルが存在しない場合は空の結果を返す（エラーにしない）
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      return res.json({ ok: true, condition: null });
    }
    const errorMessage = err.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/job-conditions/recruitment
 * 企業側の採用条件を保存
 */
router.post("/recruitment", async (req, res) => {
  try {
    const { orgAddress, ...conditionData } = req.body;

    if (!orgAddress) {
      return res.status(400).json({ error: "orgAddress is required" });
    }

    const condition = await saveRecruitmentCondition(orgAddress, conditionData);
    res.json({ ok: true, condition });
  } catch (err) {
    console.error("Error saving recruitment condition:", err);
    const errorMessage = err.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/job-conditions/recruitment
 * 企業側の採用条件を取得
 */
router.get("/recruitment", async (req, res) => {
  try {
    const { orgAddress } = req.query;

    if (!orgAddress) {
      return res.status(400).json({ error: "orgAddress is required" });
    }

    const condition = await getRecruitmentConditionByOrg(orgAddress);
    if (!condition) {
      return res.json({ ok: true, condition: null });
    }

    res.json({ ok: true, condition });
  } catch (err) {
    console.error("Error getting recruitment condition:", err);
    // テーブルが存在しない場合は空の結果を返す（エラーにしない）
    if (
      err.code === "ResourceNotFoundException" ||
      err.code === "ValidationException"
    ) {
      return res.json({ ok: true, condition: null });
    }
    const errorMessage = err.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
