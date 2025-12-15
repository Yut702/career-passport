import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// zkpフォルダのパス（プロジェクトルートのzkpフォルダ）
const ZKP_DIR = path.join(__dirname, "../../../zkp");
const BUILD_DIR = path.join(ZKP_DIR, "build");

/**
 * TOEICスコア証明を生成する（ローカル処理）
 * @param {Object} inputs - 証明入力
 * @param {number} inputs.score - TOEICスコア（秘密）
 * @param {number} inputs.minScore - 最小スコア（公開）
 * @returns {Promise<Object>} 証明データ
 */
export async function generateToeicProof(inputs) {
  const { score, minScore } = inputs;

  const wasmPath = path.join(BUILD_DIR, "toeic.wasm");
  const zkeyPath = path.join(BUILD_DIR, "toeic.zkey");

  // ファイルの存在確認
  if (!fs.existsSync(wasmPath)) {
    throw new Error(`WASMファイルが見つかりません: ${wasmPath}`);
  }
  if (!fs.existsSync(zkeyPath)) {
    throw new Error(`ZKeyファイルが見つかりません: ${zkeyPath}`);
  }

  const circuitInputs = {
    score: score,
    minScore: minScore,
  };

  try {
    // 証明を生成（ローカルファイルシステムから読み込む）
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      wasmPath,
      zkeyPath
    );

    return {
      proof,
      publicSignals,
      circuitInputs: {
        minScore,
      },
    };
  } catch (error) {
    console.error("Error generating TOEIC proof:", error);
    throw new Error(`Failed to generate TOEIC proof: ${error.message}`);
  }
}

/**
 * 学位証明を生成する（ローカル処理）
 * @param {Object} inputs - 証明入力
 * @param {number} inputs.gpa - GPA（秘密）
 * @param {number} inputs.minGpa - 最小GPA（公開、0の場合はチェックしない）
 * @returns {Promise<Object>} 証明データ
 */
export async function generateDegreeProof(inputs) {
  const { gpa, minGpa } = inputs;

  // minGpaが0の場合は証明をスキップ（常に満たされる）
  if (minGpa === 0) {
    return {
      proof: null,
      publicSignals: [],
      circuitInputs: {
        minGpa: 0,
      },
      skipped: true,
    };
  }

  const wasmPath = path.join(BUILD_DIR, "degree.wasm");
  const zkeyPath = path.join(BUILD_DIR, "degree.zkey");

  // ファイルの存在確認
  if (!fs.existsSync(wasmPath)) {
    throw new Error(`WASMファイルが見つかりません: ${wasmPath}`);
  }
  if (!fs.existsSync(zkeyPath)) {
    throw new Error(`ZKeyファイルが見つかりません: ${zkeyPath}`);
  }

  const circuitInputs = {
    gpa: Math.round(gpa * 100), // GPAを100倍して整数に変換（例: 3.8 -> 380）
    minGpa: Math.round(minGpa * 100), // 最小GPAも100倍
  };

  try {
    // 証明を生成（ローカルファイルシステムから読み込む）
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      wasmPath,
      zkeyPath
    );

    return {
      proof,
      publicSignals,
      circuitInputs: {
        minGpa,
      },
      skipped: false,
    };
  } catch (error) {
    console.error("Error generating degree proof:", error);
    throw new Error(`Failed to generate degree proof: ${error.message}`);
  }
}
