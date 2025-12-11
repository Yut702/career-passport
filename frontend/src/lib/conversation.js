/**
 * 会話ID生成ユーティリティ
 *
 * バックエンドと同じロジックで会話IDを生成します
 */

/**
 * 会話IDを生成（送信者と受信者のアドレスをソートして結合）
 *
 * @param {string} address1 - アドレス1
 * @param {string} address2 - アドレス2
 * @returns {string} 会話ID
 */
export function generateConversationId(address1, address2) {
  const addresses = [address1.toLowerCase(), address2.toLowerCase()].sort();
  return `${addresses[0]}_${addresses[1]}`;
}
