import express from "express";
import {
  saveZKPProofToFile,
  loadZKPProofFromFile,
  saveZKPProofPublicInfo,
  getZKPProofsByWallet,
  getZKPProofById,
} from "../lib/dynamo-zkp-proofs.js";
import { generateToeicProof, generateDegreeProof } from "../lib/zkp-prover.js";

const router = express.Router();

/**
 * POST /api/zkp-proofs/generate
 * ZKP証明を生成（ローカル処理）
 * @body {string} type - 証明タイプ ("toeic" | "degree")
 * @body {Object} inputs - 証明入力
 */
router.post("/generate", async (req, res) => {
  try {
    const { type, inputs } = req.body;

    if (!type || !inputs) {
      return res.status(400).json({
        error: "type and inputs are required",
      });
    }

    let proofData;
    switch (type) {
      case "toeic":
        proofData = await generateToeicProof(inputs);
        break;
      case "degree":
        proofData = await generateDegreeProof(inputs);
        break;
      default:
        return res.status(400).json({
          error: `Unknown proof type: ${type}`,
        });
    }

    res.json({
      ok: true,
      proof: proofData,
    });
  } catch (err) {
    console.error("Error generating ZKP proof:", err);
    const errorMessage = err.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/zkp-proofs
 * ZKP証明を保存（完全なデータはdataフォルダ、公開情報はデータベース）
 */
router.post("/", async (req, res) => {
  try {
    const { walletAddress, fullProofData, publicInfo } = req.body;

    if (!walletAddress || !fullProofData || !publicInfo) {
      return res.status(400).json({
        error: "walletAddress, fullProofData, and publicInfo are required",
      });
    }

    // 一意のproofIdを生成（proofHash + タイムスタンプ + ランダム文字列）
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const proofId = publicInfo.proofHash
      ? `${publicInfo.proofHash}_${timestamp}_${randomStr}`
      : `zkp_${timestamp}_${randomStr}`;

    // 完全な証明データをzkp/proofsフォルダに保存
    const filePath = saveZKPProofToFile(proofId, fullProofData, walletAddress);

    // 公開情報のみをデータベースに保存
    const publicProofData = await saveZKPProofPublicInfo(
      walletAddress,
      proofId,
      publicInfo
    );

    res.json({
      ok: true,
      proof: {
        proofId: publicProofData.proofId,
        filePath,
        publicInfo: publicProofData,
      },
    });
  } catch (err) {
    console.error("Error saving ZKP proof:", err);
    const errorMessage = err.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/zkp-proofs
 * ウォレットアドレスでZKP証明の公開情報一覧を取得
 */
router.get("/", async (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const proofs = await getZKPProofsByWallet(walletAddress);
    res.json({ ok: true, proofs });
  } catch (err) {
    console.error("Error getting ZKP proofs:", err);
    const errorMessage = err.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/zkp-proofs/:proofId
 * 証明IDでZKP証明の公開情報を取得
 */
router.get("/:proofId", async (req, res) => {
  try {
    const { proofId } = req.params;

    const proof = await getZKPProofById(proofId);
    if (!proof) {
      return res.status(404).json({ error: "Proof not found" });
    }

    res.json({ ok: true, proof });
  } catch (err) {
    console.error("Error getting ZKP proof:", err);
    const errorMessage = err.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/zkp-proofs/:proofId/full
 * 証明IDでZKP証明の完全なデータを取得（dataフォルダから）
 */
router.get("/:proofId/full", async (req, res) => {
  try {
    const { proofId } = req.params;

    const fullProofData = loadZKPProofFromFile(proofId);
    if (!fullProofData) {
      return res.status(404).json({ error: "Proof file not found" });
    }

    res.json({ ok: true, proof: fullProofData });
  } catch (err) {
    console.error("Error loading ZKP proof file:", err);
    const errorMessage = err.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
