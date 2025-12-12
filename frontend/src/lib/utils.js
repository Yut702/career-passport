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
  } catch (error) {
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
  } catch (error) {
    return String(date);
  }
}
