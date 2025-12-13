/**
 * 年齢を計算する
 * @param {string} dateOfBirth - 生年月日 (YYYY-MM-DD形式)
 * @returns {number} 年齢
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

import { getVCType, getCredentialSubject } from "../vc/vc-utils.js";

/**
 * VCデータから条件を満たしているかチェックする
 * @param {Array} vcs - VCデータの配列（W3C標準形式または簡易形式）
 * @param {Object} conditions - 条件
 * @returns {Object} 条件を満たしているかの結果
 */
export function checkConditions(vcs, conditions) {
  const results = {
    toeic: null,
    degree: null,
  };

  // TOEIC条件のチェック
  if (conditions.minToeicScore) {
    const toeicVC = vcs.find((vc) => getVCType(vc) === "toeic");
    if (toeicVC) {
      const attributes = getCredentialSubject(toeicVC);
      if (attributes.score) {
        const score = attributes.score;
        results.toeic = {
          satisfied: score >= conditions.minToeicScore,
          value: score,
          condition: `>= ${conditions.minToeicScore}`,
        };
      }
    }
  }

  // 学位条件のチェック（GPA）
  if (conditions.minGpa && conditions.minGpa > 0) {
    const degreeVC = vcs.find((vc) => getVCType(vc) === "degree");
    if (degreeVC) {
      const attributes = getCredentialSubject(degreeVC);
      if (attributes.gpa !== undefined) {
        const gpa = attributes.gpa;
        results.degree = {
          satisfied: gpa >= conditions.minGpa,
          value: gpa,
          condition: `GPA >= ${conditions.minGpa}`,
        };
      }
    }
  } else if (conditions.minGpa === 0) {
    // minGpaが0の場合は、学位証明書VCが存在することを確認
    const degreeVC = vcs.find((vc) => getVCType(vc) === "degree");
    if (degreeVC) {
      const attributes = getCredentialSubject(degreeVC);
      results.degree = {
        satisfied: true,
        value: attributes.gpa,
        condition: "学位証明書VCが存在",
      };
    }
  }

  return results;
}

/**
 * 証明データをJSON形式でシリアライズする
 * @param {Object} proofData - 証明データ
 * @returns {string} JSON文字列
 */
export function serializeProof(proofData) {
  return JSON.stringify(proofData);
}

/**
 * 証明データをJSON形式からデシリアライズする
 * @param {string} jsonString - JSON文字列
 * @returns {Object} 証明データ
 */
export function deserializeProof(jsonString) {
  return JSON.parse(jsonString);
}

/**
 * 証明データのハッシュを計算する（簡易版）
 * @param {Object} proofData - 証明データ
 * @returns {string} ハッシュ値
 */
export function hashProof(proofData) {
  const jsonString = serializeProof(proofData);
  // 簡易的なハッシュ（実際のプロダクションでは適切なハッシュ関数を使用）
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}
