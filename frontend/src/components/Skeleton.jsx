/**
 * スケルトンローディングコンポーネント
 *
 * データの読み込み中に、コンテンツの形状を模したプレースホルダーを表示します。
 * スケルトンローディングは、ユーザーに読み込み中のコンテンツの構造を予測させ、
 * より良いユーザー体験を提供します。
 *
 * 使用例:
 * ```javascript
 * function MyComponent() {
 *   const [loading, setLoading] = useState(true);
 *
 *   if (loading) {
 *     return (
 *       <div className="grid grid-cols-3 gap-4">
 *         <SkeletonCard />
 *         <SkeletonCard />
 *         <SkeletonCard />
 *       </div>
 *     );
 *   }
 *
 *   return <div>コンテンツ</div>;
 * }
 * ```
 */

/**
 * 基本的なスケルトン要素
 *
 * 任意の形状のスケルトン要素を作成するための基本コンポーネントです。
 * `className` プロパティで高さ、幅、形状などをカスタマイズできます。
 *
 * 使用例:
 * ```javascript
 * // テキスト行のスケルトン
 * <Skeleton className="h-4 w-full mb-2" />
 *
 * // 円形のスケルトン（アバターなど）
 * <Skeleton className="h-12 w-12 rounded-full" />
 *
 * // カードのスケルトン
 * <Skeleton className="h-48 w-full rounded-lg" />
 * ```
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {string} props.className - 追加の Tailwind CSS クラス（デフォルト: ""）
 * @returns {JSX.Element} スケルトン要素
 */
export default function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
      {/**
       * スケルトン要素のスタイル
       *
       * スタイルの説明:
       * - `animate-pulse`: フェードイン・フェードアウトを繰り返すアニメーション
       *   （読み込み中であることを視覚的に示す）
       * - `bg-gray-200`: 背景色をグレー（200）に設定（薄いグレー）
       * - `rounded`: 角を丸くする（デフォルトの角丸）
       * - `className`: 追加のクラス（高さ、幅、形状などを指定）
       *
       * カスタマイズ例:
       * - `h-4 w-full`: 高さ 1rem、幅 100%（テキスト行）
       * - `h-12 w-12 rounded-full`: 高さ・幅 3rem、完全な円形（アバター）
       * - `h-48 w-full rounded-lg`: 高さ 12rem、幅 100%、大きめの角丸（カード）
       */}
    </div>
  );
}

/**
 * カード形式のスケルトンコンポーネント
 *
 * NFT カードやスタンプカードなどの、カード形式のコンテンツの
 * 読み込み中に表示するスケルトンコンポーネントです。
 *
 * 使用例:
 * ```javascript
 * function NFTList() {
 *   const [loading, setLoading] = useState(true);
 *
 *   if (loading) {
 *     return (
 *       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 *         <SkeletonCard />
 *         <SkeletonCard />
 *         <SkeletonCard />
 *       </div>
 *     );
 *   }
 *
 *   return <div>NFT 一覧</div>;
 * }
 * ```
 *
 * @returns {JSX.Element} カード形式のスケルトンコンポーネント
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {/**
       * カードのコンテナ
       *
       * 実際のカードコンポーネントと同じスタイルを適用して、
       * 読み込み中のコンテンツの形状を模します。
       *
       * スタイルの説明:
       * - `bg-white`: 背景色を白に設定
       * - `rounded-2xl`: 大きめの角丸（2xl = 1rem）
       * - `shadow-lg`: 大きめの影（カードの立体感）
       * - `p-6`: パディングを 1.5rem に設定
       * - `border border-gray-100`: 薄いグレーのボーダー
       */}

      {/**
       * タイトル行のスケルトン
       *
       * カードのタイトル部分を模したスケルトン要素です。
       * 幅は 3/4（75%）に設定し、実際のタイトルの長さを想定しています。
       *
       * スタイルの説明:
       * - `h-6`: 高さを 1.5rem に設定（タイトルの高さ）
       * - `w-3/4`: 幅を 75% に設定（タイトルの長さを想定）
       * - `mb-4`: 下マージンを 1rem に設定（次の要素との間隔）
       */}
      <Skeleton className="h-6 w-3/4 mb-4" />

      {/**
       * サブテキスト行のスケルトン（1行目）
       *
       * カードのサブテキスト部分を模したスケルトン要素です。
       * 幅は 1/2（50%）に設定し、タイトルより短いテキストを想定しています。
       *
       * スタイルの説明:
       * - `h-4`: 高さを 1rem に設定（サブテキストの高さ）
       * - `w-1/2`: 幅を 50% に設定（サブテキストの長さを想定）
       * - `mb-2`: 下マージンを 0.5rem に設定（次の要素との間隔）
       */}
      <Skeleton className="h-4 w-1/2 mb-2" />

      {/**
       * サブテキスト行のスケルトン（2行目）
       *
       * カードのサブテキスト部分を模したスケルトン要素です。
       * 幅は 2/3（約 66.7%）に設定し、1行目より長いテキストを想定しています。
       *
       * スタイルの説明:
       * - `h-4`: 高さを 1rem に設定（サブテキストの高さ）
       * - `w-2/3`: 幅を約 66.7% に設定（サブテキストの長さを想定）
       *
       * このように、異なる幅のスケルトン要素を組み合わせることで、
       * より自然な読み込み中の表示を実現できます。
       */}
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
