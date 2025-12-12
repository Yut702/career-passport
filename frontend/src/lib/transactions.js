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

/**
 * エラーメッセージを日本語に変換する関数（汎用版）
 *
 * エラーオブジェクトを受け取り、エラーの種類（reason、message、code）に応じて
 * 適切な日本語メッセージに変換します。
 *
 * この関数は、`formatTransactionError()` よりも汎用的で、
 * トランザクション以外のエラーにも対応できます。
 *
 * @param {Error} error - エラーオブジェクト
 * @returns {string} 日本語のエラーメッセージ
 *
 * @example
 * ```javascript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const message = formatError(error);
 *   console.error(message); // "トランザクションが拒否されました"
 * }
 * ```
 */
export function formatError(error) {
  /**
   * エラーオブジェクトが存在しない場合
   *
   * エラーが null や undefined の場合、デフォルトメッセージを返します。
   */
  if (!error) {
    return "不明なエラーが発生しました";
  }

  /**
   * ステップ1: エラーの理由（reason）がある場合
   *
   * コントラクトから返されるエラーには、`reason` プロパティが含まれることがあります。
   * これは、Solidity の `require()` や `revert()` で指定されたメッセージです。
   * 例: "Insufficient funds", "User rejected"
   */
  if (error.reason) {
    return formatErrorReason(error.reason);
  }

  /**
   * ステップ2: エラーメッセージがある場合
   *
   * JavaScript の標準的なエラーオブジェクトには、`message` プロパティが含まれます。
   * このメッセージを解析して、日本語に変換します。
   */
  if (error.message) {
    return formatErrorMessage(error.message);
  }

  /**
   * ステップ3: エラーコードがある場合
   *
   * MetaMask などのウォレットから返されるエラーには、`code` プロパティが含まれることがあります。
   * 例: 4001 (ユーザーが拒否), 4900 (ウォレット未接続)
   */
  if (error.code) {
    return formatErrorCode(error.code);
  }

  /**
   * エラー情報が一切ない場合
   *
   * エラーオブジェクトが存在するが、reason、message、code のいずれも存在しない場合、
   * デフォルトメッセージを返します。
   */
  return "不明なエラーが発生しました";
}

/**
 * エラーの理由を日本語に変換する関数（プライベート）
 *
 * コントラクトから返されるエラーの理由（reason）を日本語に変換します。
 * よくあるエラーメッセージをマッピングし、該当するものがあれば日本語メッセージを返します。
 *
 * @private
 * @param {string} reason - エラーの理由
 * @returns {string} 日本語のエラーメッセージ
 */
function formatErrorReason(reason) {
  /**
   * エラーメッセージのマッピング
   *
   * よくあるエラーメッセージと、それに対応する日本語メッセージを定義します。
   * キーは小文字に変換して比較するため、大文字・小文字を区別しません。
   */
  const reasonMap = {
    "user rejected": "トランザクションが拒否されました",
    "insufficient funds": "ガス代が不足しています",
    "nonce too low": "トランザクションの順序が正しくありません",
    "execution reverted": "トランザクションの実行が失敗しました",
  };

  /**
   * エラーメッセージを小文字に変換して比較
   *
   * 大文字・小文字を区別せずに比較するため、reason を小文字に変換します。
   * マッピング内のキーと部分一致するものがあれば、対応する日本語メッセージを返します。
   */
  const lowerReason = reason.toLowerCase();
  for (const [key, value] of Object.entries(reasonMap)) {
    if (lowerReason.includes(key)) {
      return value;
    }
  }

  /**
   * マッピングに該当するものがない場合
   *
   * 既知のエラーメッセージに該当しない場合、元の reason をそのまま返します。
   * これにより、コントラクトから返されたエラーメッセージをそのまま表示できます。
   */
  return reason;
}

/**
 * エラーメッセージを日本語に変換する関数（プライベート）
 *
 * JavaScript のエラーメッセージを解析し、よくあるエラーメッセージを日本語に変換します。
 *
 * @private
 * @param {string} message - エラーメッセージ
 * @returns {string} 日本語のエラーメッセージ
 */
function formatErrorMessage(message) {
  /**
   * エラーメッセージのマッピング
   *
   * よくあるエラーメッセージと、それに対応する日本語メッセージを定義します。
   * キーは部分一致で検索するため、完全一致である必要はありません。
   */
  const messageMap = {
    "user rejected": "トランザクションが拒否されました",
    "insufficient funds": "ガス代が不足しています",
    nonce: "トランザクションの順序が正しくありません",
    network: "ネットワークエラーが発生しました",
    contract: "コントラクトエラーが発生しました",
  };

  /**
   * エラーメッセージを小文字に変換して比較
   *
   * 大文字・小文字を区別せずに比較するため、message を小文字に変換します。
   * マッピング内のキーと部分一致するものがあれば、対応する日本語メッセージを返します。
   */
  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(messageMap)) {
    if (lowerMessage.includes(key)) {
      return value;
    }
  }

  /**
   * マッピングに該当するものがない場合
   *
   * 既知のエラーメッセージに該当しない場合、元の message をそのまま返します。
   * これにより、エラーの詳細情報を失わずに表示できます。
   */
  return message;
}

/**
 * エラーコードを日本語に変換する関数（プライベート）
 *
 * MetaMask などのウォレットから返されるエラーコードを日本語メッセージに変換します。
 *
 * @private
 * @param {number|string} code - エラーコード
 * @returns {string} 日本語のエラーメッセージ
 */
function formatErrorCode(code) {
  /**
   * エラーコードのマッピング
   *
   * よくあるエラーコードと、それに対応する日本語メッセージを定義します。
   *
   * 主なエラーコード:
   * - 4001: ユーザーがトランザクションを拒否
   * - 4100: 承認されていないアカウント
   * - 4200: サポートされていないメソッド
   * - 4900: ウォレットが接続されていない
   * - 4901: チェーンが接続されていない
   * - -32600 〜 -32603: JSON-RPC エラーコード
   */
  const codeMap = {
    4001: "トランザクションが拒否されました",
    4100: "承認されていないアカウントです",
    4200: "サポートされていないメソッドです",
    4900: "接続されていないウォレットです",
    4901: "チェーンが接続されていません",
    "-32603": "内部エラーが発生しました",
    "-32602": "無効なパラメータです",
    "-32601": "メソッドが見つかりません",
    "-32600": "無効なリクエストです",
  };

  /**
   * エラーコードを文字列に変換して検索
   *
   * エラーコードは数値または文字列の可能性があるため、
   * 文字列に変換してマッピングを検索します。
   */
  const codeString = String(code);
  const mappedMessage = codeMap[codeString];

  /**
   * マッピングに該当するものがある場合
   *
   * 既知のエラーコードに該当する場合、対応する日本語メッセージを返します。
   */
  if (mappedMessage) {
    return mappedMessage;
  }

  /**
   * マッピングに該当するものがない場合
   *
   * 未知のエラーコードの場合、エラーコードを含むメッセージを返します。
   * これにより、デバッグ時にエラーコードを確認できます。
   */
  return `エラーコード: ${code}`;
}
