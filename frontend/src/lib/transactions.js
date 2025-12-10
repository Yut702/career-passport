/**
 * トランザクション状態管理ユーティリティ
 *
 * ブロックチェーントランザクションの状態管理とエラーハンドリングを提供します。
 */

/**
 * トランザクションの状態を表す定数
 *
 * @constant {Object} TRANSACTION_STATUS
 * @property {string} IDLE - 初期状態（トランザクション未送信）
 * @property {string} PENDING - 送信済み（メモリプールに送信されたが、まだブロックに含まれていない）
 * @property {string} CONFIRMING - 確認中（ブロックに含まれたが、確認待ち）
 * @property {string} SUCCESS - 成功（トランザクションが正常に完了）
 * @property {string} ERROR - エラー（トランザクションが失敗した）
 */
export const TRANSACTION_STATUS = {
  IDLE: "idle",
  PENDING: "pending",
  CONFIRMING: "confirming",
  SUCCESS: "success",
  ERROR: "error",
};

/**
 * トランザクションの確認を待つ関数
 *
 * トランザクションハッシュを受け取り、ブロックに含まれるまで待機します。
 * トランザクションが成功したかどうかを判定して返します。
 *
 * @async
 * @param {ethers.Provider} provider - Ethers.js プロバイダー
 * @param {string} txHash - トランザクションハッシュ
 * @returns {Promise<Object>} トランザクション結果
 * @returns {boolean} success - トランザクションが成功したかどうか
 * @returns {ethers.TransactionReceipt|null} receipt - トランザクションレシート（成功時）
 * @returns {Error|null} error - エラーオブジェクト（失敗時）
 *
 * @example
 * ```javascript
 * const tx = await contract.someFunction();
 * const result = await waitForTransaction(provider, tx.hash);
 *
 * if (result.success) {
 *   console.log("トランザクション成功:", result.receipt);
 * } else {
 *   console.error("トランザクション失敗:", result.error);
 * }
 * ```
 */
export async function waitForTransaction(provider, txHash) {
  try {
    // トランザクションの確認を待つ（デフォルトで1ブロック確認）
    const receipt = await provider.waitForTransaction(txHash);

    // receipt.status === 1 は成功、0 は失敗（リバート）
    return {
      success: receipt.status === 1,
      receipt,
    };
  } catch (error) {
    // エラーが発生した場合（タイムアウトなど）
    return {
      success: false,
      error,
    };
  }
}

/**
 * トランザクションエラーを日本語のメッセージに変換する関数
 *
 * Ethers.js や MetaMask から返されるエラーを、
 * ユーザーにわかりやすい日本語のメッセージに変換します。
 *
 * @param {Error} error - エラーオブジェクト
 * @returns {string} 日本語のエラーメッセージ
 *
 * @example
 * ```javascript
 * try {
 *   await contract.someFunction();
 * } catch (error) {
 *   const message = formatTransactionError(error);
 *   alert(message); // "トランザクションが拒否されました"
 * }
 * ```
 */
export function formatTransactionError(error) {
  // コントラクトから返されたエラーメッセージ（reason）がある場合
  if (error.reason) {
    return error.reason;
  }

  // エラーメッセージがある場合
  if (error.message) {
    // よくあるエラーメッセージを日本語に変換
    const errorMessage = error.message.toLowerCase();

    // ユーザーがトランザクションを拒否した場合
    if (
      errorMessage.includes("user rejected") ||
      errorMessage.includes("user denied")
    ) {
      return "トランザクションが拒否されました";
    }

    // ガス代が不足している場合
    if (
      errorMessage.includes("insufficient funds") ||
      errorMessage.includes("gas")
    ) {
      return "ガス代が不足しています";
    }

    // ノンス（トランザクション順序）エラー
    if (errorMessage.includes("nonce")) {
      return "トランザクションの順序が正しくありません";
    }

    // ネットワークエラー
    if (
      errorMessage.includes("network") ||
      errorMessage.includes("connection")
    ) {
      return "ネットワークエラーが発生しました";
    }

    // コントラクトエラー（実行がリバートされた場合など）
    if (
      errorMessage.includes("revert") ||
      errorMessage.includes("execution reverted")
    ) {
      return "トランザクションの実行に失敗しました";
    }

    // その他のエラーメッセージをそのまま返す
    return error.message;
  }

  // エラーコードがある場合
  if (error.code) {
    // MetaMask のエラーコード
    switch (error.code) {
      case 4001:
        return "トランザクションが拒否されました";
      case -32002:
        return "既に処理中のリクエストがあります";
      case -32603:
        return "内部エラーが発生しました";
      default:
        return `エラーコード: ${error.code}`;
    }
  }

  // エラー情報が一切ない場合
  return "不明なエラーが発生しました";
}

/**
 * トランザクションの状態を取得する関数
 *
 * トランザクションハッシュから現在の状態を確認します。
 *
 * @async
 * @param {ethers.Provider} provider - Ethers.js プロバイダー
 * @param {string} txHash - トランザクションハッシュ
 * @returns {Promise<string>} トランザクションの状態（TRANSACTION_STATUS の値）
 *
 * @example
 * ```javascript
 * const status = await getTransactionStatus(provider, txHash);
 * if (status === TRANSACTION_STATUS.SUCCESS) {
 *   console.log("トランザクション成功");
 * }
 * ```
 */
export async function getTransactionStatus(provider, txHash) {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      // レシートがまだ存在しない場合（メモリプールに送信されたが、まだブロックに含まれていない）
      return TRANSACTION_STATUS.PENDING;
    }

    if (receipt.status === 1) {
      // トランザクションが成功
      return TRANSACTION_STATUS.SUCCESS;
    } else {
      // トランザクションが失敗（リバート）
      return TRANSACTION_STATUS.ERROR;
    }
  } catch (error) {
    console.error("Error getting transaction status:", error);
    return TRANSACTION_STATUS.ERROR;
  }
}
