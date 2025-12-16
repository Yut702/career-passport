/**
 * 共通ユーティリティ関数
 */

/**
 * ウォレットアドレスを短縮表示する関数
 *
 * @param {string} address - ウォレットアドレス
 * @returns {string} 短縮されたアドレス（例: "0x1234...cdef"）
 */
export function formatAddress(address) {
  if (!address) return "";
  if (address.startsWith("0x") && address.length === 42) {
    // ウォレットアドレスの場合、短縮表示
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return address;
}

/**
 * 企業名を表示用に整形する関数
 *
 * @param {string} orgWalletAddress - 企業のウォレットアドレス
 * @returns {string} 整形された企業名
 */
export function formatOrganization(orgWalletAddress) {
  if (!orgWalletAddress) return "企業";
  if (orgWalletAddress.startsWith("0x") && orgWalletAddress.length === 42) {
    // ウォレットアドレスの場合、短縮表示
    return `企業 (${formatAddress(orgWalletAddress)})`;
  }
  return orgWalletAddress;
}

/**
 * 日付をフォーマットする関数
 *
 * @param {string|Date} date - 日付
 * @param {string} locale - ロケール（デフォルト: "ja-JP"）
 * @returns {string} フォーマットされた日付
 */
export function formatDate(date, locale = "ja-JP") {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale);
  } catch {
    return String(date);
  }
}

/**
 * 日時をフォーマットする関数
 *
 * @param {string|Date} date - 日時
 * @param {string} locale - ロケール（デフォルト: "ja-JP"）
 * @returns {string} フォーマットされた日時
 */
export function formatDateTime(date, locale = "ja-JP") {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString(locale);
  } catch {
    return String(date);
  }
}

/**
 * ZKP証明の重複を除去する関数
 * proofHash、proofId、idの順で重複チェックを行う
 *
 * @param {Array} proofs - ZKP証明の配列
 * @returns {Array} 重複が除去されたZKP証明の配列
 */
export function removeDuplicateZKPProofs(proofs) {
  if (!Array.isArray(proofs)) return [];

  const uniqueProofs = [];
  const seenHashes = new Set();
  const seenIds = new Set();

  for (const proof of proofs) {
    // proofHashがある場合はproofHashで重複チェック（優先）
    if (proof.proofHash) {
      if (!seenHashes.has(proof.proofHash)) {
        seenHashes.add(proof.proofHash);
        uniqueProofs.push(proof);
      }
    } else if (proof.proofId) {
      // proofIdがある場合はproofIdで重複チェック（データベースから取得した場合）
      if (!seenIds.has(proof.proofId)) {
        seenIds.add(proof.proofId);
        uniqueProofs.push(proof);
      }
    } else if (proof.id) {
      // idがある場合はidで重複チェック（ローカルストレージから取得した場合）
      if (!seenIds.has(proof.id)) {
        seenIds.add(proof.id);
        uniqueProofs.push(proof);
      }
    } else {
      // proofHashもidもない場合はそのまま追加（念のため）
      uniqueProofs.push(proof);
    }
  }

  return uniqueProofs;
}
