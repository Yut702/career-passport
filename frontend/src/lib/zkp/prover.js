import { zkpProofAPI } from "../api.js";

/**
 * TOEICスコア証明を生成する（バックエンドのローカル処理を呼び出す）
 * @param {Object} inputs - 証明入力
 * @param {number} inputs.score - TOEICスコア（秘密）
 * @param {number} inputs.minScore - 最小スコア（公開）
 * @returns {Promise<Object>} 証明データ
 */
export async function generateToeicProof(inputs) {
  try {
    const response = await zkpProofAPI.generateProof("toeic", inputs);
    if (response.ok && response.proof) {
      return response.proof;
    } else {
      throw new Error(response.error || "証明の生成に失敗しました");
    }
  } catch (error) {
    console.error("Error generating TOEIC proof:", error);
    throw new Error(`Failed to generate TOEIC proof: ${error.message}`);
  }
}

/**
 * 学位証明を生成する（バックエンドのローカル処理を呼び出す）
 * @param {Object} inputs - 証明入力
 * @param {number} inputs.gpa - GPA（秘密）
 * @param {number} inputs.minGpa - 最小GPA（公開、0の場合はチェックしない）
 * @returns {Promise<Object>} 証明データ
 */
export async function generateDegreeProof(inputs) {
  // minGpaが0の場合は証明をスキップ（常に満たされる）
  if (inputs.minGpa === 0) {
    return {
      proof: null,
      publicSignals: [],
      circuitInputs: {
        minGpa: 0,
      },
      skipped: true,
    };
  }

  try {
    const response = await zkpProofAPI.generateProof("degree", inputs);
    if (response.ok && response.proof) {
      return response.proof;
    } else {
      throw new Error(response.error || "証明の生成に失敗しました");
    }
  } catch (error) {
    console.error("Error generating degree proof:", error);
    throw new Error(`Failed to generate degree proof: ${error.message}`);
  }
}
