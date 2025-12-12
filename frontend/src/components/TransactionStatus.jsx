import { TRANSACTION_STATUS } from "../lib/transactions";

/**
 * トランザクション状態表示コンポーネント
 *
 * ブロックチェーントランザクションの現在の状態を視覚的に表示します。
 * トランザクションの送信、確認、成功、失敗などの状態に応じて、
 * 適切なアイコンとメッセージを表示します。
 *
 * 使用例:
 * ```javascript
 * function MyComponent() {
 *   const [status, setStatus] = useState(TRANSACTION_STATUS.IDLE);
 *   const [txHash, setTxHash] = useState(null);
 *
 *   const handleTransaction = async () => {
 *     setStatus(TRANSACTION_STATUS.PENDING);
 *     const tx = await contract.someFunction();
 *     setTxHash(tx.hash);
 *
 *     setStatus(TRANSACTION_STATUS.CONFIRMING);
 *     await tx.wait();
 *
 *     setStatus(TRANSACTION_STATUS.SUCCESS);
 *   };
 *
 *   return (
 *     <div>
 *       <TransactionStatus status={status} txHash={txHash} />
 *       <button onClick={handleTransaction}>実行</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {string} props.status - トランザクションの状態（TRANSACTION_STATUS の値）
 * @param {string|null} props.txHash - トランザクションハッシュ（オプション）
 * @param {string|null} props.message - カスタムメッセージ（オプション、SUCCESS と ERROR の場合のみ使用）
 * @returns {JSX.Element|null} トランザクション状態コンポーネント（IDLE の場合は null）
 */
export default function TransactionStatus({ status, txHash, message }) {
  /**
   * IDLE 状態の場合は何も表示しない
   *
   * トランザクションがまだ送信されていない場合（IDLE 状態）は、
   * コンポーネントを表示しません。
   * これにより、不要な UI 要素を表示せず、画面をすっきりと保てます。
   */
  if (status === TRANSACTION_STATUS.IDLE) {
    return null;
  }

  /**
   * 状態ごとの設定
   *
   * 各トランザクション状態に応じて、背景色、ボーダー色、テキスト色、
   * アイコン、メッセージを定義します。
   *
   * 状態の説明:
   * - PENDING: トランザクションを送信済み（メモリプールに送信されたが、まだブロックに含まれていない）
   * - CONFIRMING: トランザクションの確認中（ブロックに含まれたが、確認待ち）
   * - SUCCESS: トランザクションが成功（正常に完了）
   * - ERROR: トランザクションが失敗（エラーが発生）
   */
  const statusConfig = {
    /**
     * PENDING 状態の設定
     *
     * トランザクションがメモリプールに送信されたが、
     * まだブロックに含まれていない状態です。
     */
    [TRANSACTION_STATUS.PENDING]: {
      bg: "bg-yellow-50", // 背景色: 薄い黄色（注意を促す）
      border: "border-yellow-200", // ボーダー色: 黄色（200）
      text: "text-yellow-800", // テキスト色: 濃い黄色（800）
      icon: "⏳", // アイコン: 砂時計（処理中を表す）
      message: "トランザクションを送信しています...", // デフォルトメッセージ
    },

    /**
     * CONFIRMING 状態の設定
     *
     * トランザクションがブロックに含まれたが、
     * まだ確認待ちの状態です。
     */
    [TRANSACTION_STATUS.CONFIRMING]: {
      bg: "bg-blue-50", // 背景色: 薄い青色（進行中を表す）
      border: "border-blue-200", // ボーダー色: 青色（200）
      text: "text-blue-800", // テキスト色: 濃い青色（800）
      icon: "⏳", // アイコン: 砂時計（確認中を表す）
      message: "トランザクションの確認を待っています...", // デフォルトメッセージ
    },

    /**
     * SUCCESS 状態の設定
     *
     * トランザクションが正常に完了した状態です。
     */
    [TRANSACTION_STATUS.SUCCESS]: {
      bg: "bg-green-50", // 背景色: 薄い緑色（成功を表す）
      border: "border-green-200", // ボーダー色: 緑色（200）
      text: "text-green-800", // テキスト色: 濃い緑色（800）
      icon: "✅", // アイコン: チェックマーク（成功を表す）
      message: message || "トランザクションが完了しました！", // カスタムメッセージまたはデフォルトメッセージ
    },

    /**
     * ERROR 状態の設定
     *
     * トランザクションが失敗した状態です。
     */
    [TRANSACTION_STATUS.ERROR]: {
      bg: "bg-red-50", // 背景色: 薄い赤色（エラーを表す）
      border: "border-red-200", // ボーダー色: 赤色（200）
      text: "text-red-800", // テキスト色: 濃い赤色（800）
      icon: "❌", // アイコン: バツマーク（エラーを表す）
      message: message || "トランザクションが失敗しました", // カスタムメッセージまたはデフォルトメッセージ
    },
  };

  /**
   * 現在の状態に対応する設定を取得
   *
   * 状態が statusConfig に存在しない場合（未知の状態）は、
   * ERROR 状態の設定を使用します。
   * これにより、予期しない状態でも適切にエラーとして表示されます。
   */
  const config = statusConfig[status] || statusConfig[TRANSACTION_STATUS.ERROR];

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 mb-4`}>
      {/**
       * 状態表示のコンテナ
       *
       * 状態に応じた背景色、ボーダー色を適用します。
       *
       * スタイルの説明:
       * - `${config.bg}`: 状態に応じた背景色（例: bg-yellow-50）
       * - `border ${config.border}`: 状態に応じたボーダー色（例: border-yellow-200）
       * - `rounded-lg`: 大きめの角丸
       * - `p-4`: パディングを 1rem に設定
       * - `mb-4`: 下マージンを 1rem に設定（次の要素との間隔）
       */}
      <div className="flex items-center space-x-2">
        {/**
         * アイコン
         *
         * 状態に応じたアイコンを表示します。
         * アイコンは視覚的に状態を伝える重要な要素です。
         *
         * スタイルの説明:
         * - `text-xl`: テキストサイズを 1.25rem に設定（アイコンのサイズ）
         */}
        <span className="text-xl">{config.icon}</span>

        {/**
         * メッセージとトランザクションハッシュ
         *
         * 状態メッセージと、トランザクションハッシュ（存在する場合）を表示します。
         *
         * スタイルの説明:
         * - `flex-1`: 残りのスペースをすべて使用（アイコンの横に配置）
         */}
        <div className="flex-1">
          {/**
           * 状態メッセージ
           *
           * 現在のトランザクション状態を説明するメッセージを表示します。
           *
           * スタイルの説明:
           * - `${config.text}`: 状態に応じたテキスト色（例: text-yellow-800）
           * - `font-semibold`: フォントの太さをセミボールドに設定（メッセージを強調）
           */}
          <div className={`${config.text} font-semibold`}>{config.message}</div>

          {/**
           * トランザクションハッシュ（オプション）
           *
           * トランザクションハッシュが提供されている場合、表示します。
           * ハッシュは長いため、最初の10文字と最後の8文字のみを表示し、
           * 中間を "..." で省略します。
           *
           * 例: "0x1234567890abcdef..." → "TX: 0x1234567...cdef1234"
           *
           * スタイルの説明:
           * - `text-xs`: テキストサイズを 0.75rem に設定（小さめのテキスト）
           * - `text-gray-600`: テキストの色をグレー（600）に設定（補足情報として表示）
           * - `mt-1`: 上マージンを 0.25rem に設定（メッセージとの間隔）
           * - `font-mono`: 等幅フォントを使用（ハッシュの可読性向上）
           * - `break-all`: 長い文字列を強制的に改行（レイアウトの崩れを防ぐ）
           */}
          {txHash && (
            <div className="text-xs text-gray-600 mt-1 font-mono break-all">
              TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
