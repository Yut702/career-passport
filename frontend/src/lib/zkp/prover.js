import * as snarkjs from "snarkjs";

/**
 * TOEICスコア証明を生成する
 * @param {Object} inputs - 証明入力
 * @param {number} inputs.score - TOEICスコア（秘密）
 * @param {number} inputs.minScore - 最小スコア（公開）
 * @returns {Promise<Object>} 証明データ
 */
export async function generateToeicProof(inputs) {
  const { score, minScore } = inputs;

  const wasmPath = "/zkp/build/toeic.wasm";
  const zkeyPath = "/zkp/build/toeic.zkey";

  try {
    // ファイルの存在確認
    const wasmResponse = await fetch(wasmPath);
    if (!wasmResponse.ok) {
      throw new Error(
        `WASMファイルが見つかりません: ${wasmPath} (${wasmResponse.status})`
      );
    }

    const zkeyResponse = await fetch(zkeyPath);
    if (!zkeyResponse.ok) {
      throw new Error(
        `ZKeyファイルが見つかりません: ${zkeyPath} (${zkeyResponse.status})`
      );
    }

    const circuitInputs = {
      score: score,
      minScore: minScore,
    };

    // 証明を生成（ファイルパスを直接渡す）
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
 * 学位証明を生成する
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

  const wasmPath = "/zkp/build/degree.wasm";
  const zkeyPath = "/zkp/build/degree.zkey";

  try {
    // ファイルの存在確認
    const wasmResponse = await fetch(wasmPath);
    if (!wasmResponse.ok) {
      throw new Error(
        `WASMファイルが見つかりません: ${wasmPath} (${wasmResponse.status})`
      );
    }

    const zkeyResponse = await fetch(zkeyPath);
    if (!zkeyResponse.ok) {
      throw new Error(
        `ZKeyファイルが見つかりません: ${zkeyPath} (${zkeyResponse.status})`
      );
    }

    const circuitInputs = {
      gpa: Math.round(gpa * 100), // GPAを100倍して整数に変換（例: 3.8 -> 380）
      minGpa: Math.round(minGpa * 100), // 最小GPAも100倍
    };

    // 証明を生成（ファイルパスを直接渡す）
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
