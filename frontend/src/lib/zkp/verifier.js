import * as snarkjs from "snarkjs";

/**
 * TOEIC証明を検証する
 * @param {Object} proofData - 証明データ
 * @param {Object} proofData.proof - 証明オブジェクト
 * @param {Array} proofData.publicSignals - 公開信号
 * @returns {Promise<boolean>} 検証結果
 */
export async function verifyToeicProof(proofData) {
  const { proof, publicSignals } = proofData;

  try {
    // 検証鍵は公開情報なので、frontend/public/zkp/build/から読み込む
    const vkeyPath = "/zkp/build/toeic.vkey.json";
    const vkeyResponse = await fetch(vkeyPath);
    if (!vkeyResponse.ok) {
      throw new Error(
        `検証鍵ファイルが見つかりません: ${vkeyPath} (${vkeyResponse.status})\n` +
          `検証鍵ファイル（.vkey.json）がfrontend/public/zkp/build/に配置されていることを確認してください。`
      );
    }
    const vkey = await vkeyResponse.json();

    const result = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    return result;
  } catch (error) {
    console.error("Error verifying TOEIC proof:", error);
    return false;
  }
}

/**
 * 学位証明を検証する
 * @param {Object} proofData - 証明データ
 * @param {Object} proofData.proof - 証明オブジェクト（nullの場合はスキップ）
 * @param {Array} proofData.publicSignals - 公開信号
 * @returns {Promise<boolean>} 検証結果
 */
export async function verifyDegreeProof(proofData) {
  // スキップされた場合は常にtrue
  if (proofData.skipped || !proofData.proof) {
    return true;
  }

  const { proof, publicSignals } = proofData;

  try {
    // 検証鍵は公開情報なので、frontend/public/zkp/build/から読み込む
    const vkeyPath = "/zkp/build/degree.vkey.json";
    const vkeyResponse = await fetch(vkeyPath);
    if (!vkeyResponse.ok) {
      throw new Error(
        `検証鍵ファイルが見つかりません: ${vkeyPath} (${vkeyResponse.status})\n` +
          `検証鍵ファイル（.vkey.json）がfrontend/public/zkp/build/に配置されていることを確認してください。`
      );
    }
    const vkey = await vkeyResponse.json();

    const result = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    return result;
  } catch (error) {
    console.error("Error verifying degree proof:", error);
    return false;
  }
}

/**
 * 証明を検証する（高レベルAPI）
 * @param {Object} proofResult - 証明結果
 * @param {Array} proofResult.proofs - 証明の配列
 * @returns {Promise<Object>} 検証結果
 */
export async function verifyProofs(proofResult) {
  const { proofs } = proofResult;
  const verificationResults = [];

  for (const proofItem of proofs) {
    let verified = false;

    try {
      switch (proofItem.type) {
        case "toeic":
          verified = await verifyToeicProof(proofItem.proof);
          break;
        case "degree":
          verified = await verifyDegreeProof(proofItem.proof);
          break;
        default:
          console.warn(`Unknown proof type: ${proofItem.type}`);
      }
    } catch (error) {
      console.error(`Error verifying ${proofItem.type} proof:`, error);
      verified = false;
    }

    verificationResults.push({
      type: proofItem.type,
      verified,
    });
  }

  const allVerified = verificationResults.every((result) => result.verified);

  return {
    allVerified,
    results: verificationResults,
  };
}
