/**
 * ローディングコンポーネント
 *
 * データの読み込み中や処理中に表示する統一されたローディングコンポーネントです。
 * スピナーアニメーションとメッセージを表示します。
 *
 * 使用例:
 * ```javascript
 * function MyComponent() {
 *   const [loading, setLoading] = useState(true);
 *
 *   if (loading) {
 *     return <Loading message="データを読み込み中..." />;
 *   }
 *
 *   return <div>コンテンツ</div>;
 * }
 * ```
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {string} props.message - 表示するメッセージ（デフォルト: "読み込み中..."）
 * @returns {JSX.Element} ローディングコンポーネント
 */
export default function Loading({ message = "読み込み中..." }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      {/**
       * スピナーアニメーション
       *
       * Tailwind CSS の `animate-spin` クラスを使用して、
       * 回転するスピナーを表示します。
       *
       * スタイルの説明:
       * - `animate-spin`: 無限に回転するアニメーション
       * - `rounded-full`: 完全な円形
       * - `h-12 w-12`: 高さと幅を 12 (3rem = 48px) に設定
       * - `border-b-2`: 下側のボーダーのみを表示（2px の太さ）
       * - `border-blue-600`: ボーダーの色を青（600）に設定
       *
       * このスピナーは、データの読み込み中であることを視覚的に示します。
       */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>

      {/**
       * ローディングメッセージ
       *
       * ユーザーに現在の処理状態を伝えるメッセージを表示します。
       * デフォルトでは "読み込み中..." が表示されますが、
       * プロパティでカスタマイズ可能です。
       *
       * スタイルの説明:
       * - `text-gray-600`: テキストの色をグレー（600）に設定
       *
       * カスタマイズ例:
       * - <Loading message="ブロックチェーンからデータを取得中..." />
       * - <Loading message="トランザクションを確認中..." />
       * - <Loading message="同期中..." />
       */}
      <div className="text-gray-600">{message}</div>
    </div>
  );
}

