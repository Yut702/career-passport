/**
 * VC（Verifiable Credential）の変換ユーティリティ
 * W3C Verifiable Credentials標準規格との互換性を提供
 */

/**
 * 簡易形式のVCをW3C標準形式に変換
 * @param {Object} simpleVC - 簡易形式のVC
 * @returns {Object} W3C標準形式のVC
 */
export function convertToW3CFormat(simpleVC) {
  // W3C標準形式のVCを作成
  const w3cVC = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://www.w3.org/2018/credentials/examples/v1",
    ],
    type: ["VerifiableCredential", getVCType(simpleVC.type)],
    id: simpleVC.id || `urn:uuid:${generateUUID()}`,
    issuer: typeof simpleVC.issuer === "string" 
      ? { id: simpleVC.issuer, name: simpleVC.issuer }
      : simpleVC.issuer,
    issuanceDate: simpleVC.issuedAt || new Date().toISOString(),
    credentialSubject: {
      id: simpleVC.credentialSubject?.id || `urn:uuid:${generateUUID()}`,
      ...simpleVC.attributes, // 既存のattributesをcredentialSubjectにマッピング
    },
  };

  // 説明やカスタムフィールドを保持
  if (simpleVC.description) {
    w3cVC.description = simpleVC.description;
  }
  if (simpleVC.verified !== undefined) {
    w3cVC.verified = simpleVC.verified;
  }

  // 証明（proof）が存在する場合は追加
  if (simpleVC.proof) {
    w3cVC.proof = simpleVC.proof;
  }

  return w3cVC;
}

/**
 * W3C標準形式のVCを簡易形式に変換（後方互換性のため）
 * @param {Object} w3cVC - W3C標準形式のVC
 * @returns {Object} 簡易形式のVC
 */
export function convertFromW3CFormat(w3cVC) {
  // 簡易形式のVCを作成
  const simpleVC = {
    id: w3cVC.id,
    type: extractVCType(w3cVC.type),
    issuer: typeof w3cVC.issuer === "string" 
      ? w3cVC.issuer 
      : w3cVC.issuer?.name || w3cVC.issuer?.id,
    issuedAt: w3cVC.issuanceDate,
    attributes: { ...w3cVC.credentialSubject },
  };

  // idをattributesから除外
  if (simpleVC.attributes.id) {
    delete simpleVC.attributes.id;
  }

  // 説明やカスタムフィールドを保持
  if (w3cVC.description) {
    simpleVC.description = w3cVC.description;
  }
  if (w3cVC.verified !== undefined) {
    simpleVC.verified = w3cVC.verified;
  }

  return simpleVC;
}

/**
 * VCタイプをW3C標準形式に変換
 * @param {string} type - 簡易タイプ
 * @returns {string} W3C標準タイプ
 */
function getVCType(type) {
  const typeMap = {
    myNumber: "MyNumberCredential",
    toeic: "TOEICCredential",
    degree: "DegreeCredential",
    certification: "CertificationCredential",
  };
  return typeMap[type] || type;
}

/**
 * W3C標準タイプから簡易タイプを抽出
 * @param {string|Array} w3cType - W3C標準タイプ
 * @returns {string} 簡易タイプ
 */
function extractVCType(w3cType) {
  if (Array.isArray(w3cType)) {
    // "VerifiableCredential"以外の最初のタイプを取得
    const customType = w3cType.find((t) => t !== "VerifiableCredential");
    if (customType) {
      const typeMap = {
        MyNumberCredential: "myNumber",
        TOEICCredential: "toeic",
        DegreeCredential: "degree",
        CertificationCredential: "certification",
      };
      return typeMap[customType] || customType.toLowerCase();
    }
  }
  return typeof w3cType === "string" ? w3cType : "unknown";
}

/**
 * 簡易UUID生成（実際の実装では適切なUUIDライブラリを使用）
 * @returns {string} UUID
 */
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

/**
 * VCを標準化（W3C形式に変換、または簡易形式に変換）
 * @param {Object} vc - VCオブジェクト
 * @param {boolean} toW3C - W3C形式に変換するかどうか
 * @returns {Object} 変換されたVC
 */
export function normalizeVC(vc, toW3C = false) {
  if (toW3C) {
    return isW3CFormat(vc) ? vc : convertToW3CFormat(vc);
  } else {
    return isW3CFormat(vc) ? convertFromW3CFormat(vc) : vc;
  }
}

