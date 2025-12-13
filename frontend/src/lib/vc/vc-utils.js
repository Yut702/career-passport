/**
 * VC（Verifiable Credential）ユーティリティ
 * W3C標準形式のVCを扱うためのヘルパー関数
 */

/**
 * W3C標準形式のVCからタイプを取得
 * @param {Object} vc - W3C標準形式のVC
 * @returns {string} VCタイプ（myNumber, toeic, degreeなど）
 */
export function getVCType(vc) {
  if (!vc.type) return "unknown";

  if (Array.isArray(vc.type)) {
    // "VerifiableCredential"以外の最初のタイプを取得
    const customType = vc.type.find((t) => t !== "VerifiableCredential");
    if (customType) {
      const typeMap = {
        MyNumberCredential: "myNumber",
        TOEICCredential: "toeic",
        DegreeCredential: "degree",
        CertificationCredential: "certification",
      };
      return (
        typeMap[customType] ||
        customType.toLowerCase().replace("credential", "")
      );
    }
  }

  // 簡易形式のフォールバック
  return vc.type || "unknown";
}

/**
 * W3C標準形式のVCから発行者名を取得
 * @param {Object} vc - W3C標準形式のVC
 * @returns {string} 発行者名
 */
export function getIssuerName(vc) {
  if (typeof vc.issuer === "string") {
    return vc.issuer;
  }
  if (vc.issuer && typeof vc.issuer === "object") {
    return vc.issuer.name || vc.issuer.id || "Unknown";
  }
  return "Unknown";
}

/**
 * W3C標準形式のVCから発行日を取得
 * @param {Object} vc - W3C標準形式のVC
 * @returns {string} 発行日（ISO形式）
 */
export function getIssuanceDate(vc) {
  return vc.issuanceDate || vc.issuedAt || new Date().toISOString();
}

/**
 * W3C標準形式のVCからcredentialSubjectを取得
 * @param {Object} vc - W3C標準形式のVC
 * @returns {Object} credentialSubject（属性データ）
 */
export function getCredentialSubject(vc) {
  // W3C標準形式の場合
  if (vc.credentialSubject) {
    const subject = { ...vc.credentialSubject };
    // idを除外（属性として扱わない）
    if (subject.id) {
      delete subject.id;
    }
    return subject;
  }

  // 簡易形式のフォールバック
  return vc.attributes || {};
}

/**
 * W3C標準形式のVCから特定の属性を取得
 * @param {Object} vc - W3C標準形式のVC
 * @param {string} attributeName - 属性名
 * @returns {any} 属性値
 */
export function getAttribute(vc, attributeName) {
  const subject = getCredentialSubject(vc);
  return subject[attributeName];
}

/**
 * VCがW3C標準形式かどうかをチェック
 * @param {Object} vc - VCオブジェクト
 * @returns {boolean} W3C標準形式かどうか
 */
export function isW3CFormat(vc) {
  return (
    vc["@context"] !== undefined &&
    Array.isArray(vc.type) &&
    vc.type.includes("VerifiableCredential") &&
    vc.credentialSubject !== undefined &&
    vc.issuanceDate !== undefined
  );
}
