import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import StampCard from "../components/StampCard";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { storage } from "../lib/storage";

/**
 * ユーザーダッシュボード（ホーム画面）
 *
 * ブロックチェーンからスタンプとNFTを読み込み、ユーザーの統計情報を表示します。
 * ウォレットが接続されていない場合は、ローカルストレージから読み込みます（フォールバック）。
 */
export default function Home() {
  // コントラクトインスタンスを取得
  const { nftContract, stampManagerContract, isReady } = useContracts();
  // ウォレット接続状態を取得
  const { account, isConnected } = useWallet();

  // 状態管理
  const [user, setUser] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [organizationStats, setOrganizationStats] = useState({});
  const [loading, setLoading] = useState(true);

  /**
   * ローカルストレージからデータを読み込む関数（フォールバック）
   *
   * ウォレットが接続されていない場合や、ブロックチェーンからの読み込みに失敗した場合に使用します。
   * ローカルストレージに保存されたデータを読み込み、表示します。
   *
   * useCallback でメモ化することで、関数の再作成を防ぎます。
   * この関数は依存関係がないため、常に同じ関数インスタンスを返します。
   *
   * @async
   * @returns {Promise<void>}
   */
  const loadDataFromStorage = useCallback(() => {
    try {
      /**
       * ローカルストレージからデータを取得
       *
       * 以下のデータをローカルストレージから取得します：
       * - ユーザー情報
       * - スタンプデータ
       * - NFT データ
       */
      const userData = storage.getUser();
      const stampsData = storage.getStamps();
      const nftsData = storage.getNFTs();

      setUser(userData);
      setStamps(stampsData || []);
      setNfts(nftsData || []);

      /**
       * 企業別のスタンプ数を集計
       *
       * ダッシュボードに表示する統計情報を計算します。
       * ブロックチェーンから読み込む場合と同じロジックを使用します。
       */
      const stats = {};
      if (stampsData && stampsData.length > 0) {
        stampsData.forEach((stamp) => {
          if (!stats[stamp.organization]) {
            stats[stamp.organization] = 0;
          }
          stats[stamp.organization]++;
        });
      }
      setOrganizationStats(stats);
    } catch (err) {
      /**
       * エラーハンドリング: ローカルストレージからの読み込みに失敗した場合
       *
       * ローカルストレージが無効な場合や、データが破損している場合にエラーが発生します。
       * ただし、データが存在しない場合は正常な状態として扱います。
       */
      console.warn("Warning: Could not load data from storage:", err);
      // データが存在しない場合はエラーとしない（新規ユーザーの可能性）
      setStamps([]);
      setNfts([]);
      setOrganizationStats({});
      // エラーを設定しない（空のデータで表示を続ける）
    } finally {
      /**
       * ローディング状態を解除
       */
      setLoading(false);
    }
  }, []);

  /**
   * ブロックチェーンからデータを読み込む関数
   *
   * 以下のデータをブロックチェーンから取得します：
   * 1. スタンプ情報（StampManager コントラクトから）
   * 2. NFT 情報（NonFungibleCareerNFT コントラクトから）
   * 3. 企業別のスタンプ数統計
   *
   * 取得したデータはローカルストレージに保存（キャッシュ）し、
   * 次回アクセス時のパフォーマンスを向上させます。
   *
   * useCallback でメモ化することで、依存関係が変更されない限り
   * 関数の再作成を防ぎ、パフォーマンスを向上させます。
   *
   * @async
   * @returns {Promise<void>}
   * @throws {Error} コントラクトが読み込まれていない場合
   * @throws {Error} ブロックチェーンからの読み込みに失敗した場合
   */
  const loadData = useCallback(async () => {
    // コントラクトとアカウントが存在しない場合は処理を中断
    if (!stampManagerContract || !nftContract || !account) return;

    setLoading(true);

    try {
      /**
       * ステップ1: ユーザー情報を取得（ローカルストレージから）
       *
       * ユーザー情報はブロックチェーン上には保存されていないため、
       * ローカルストレージから取得します。
       * 将来的には、ウォレットアドレスからユーザー情報を取得する設計も可能です。
       */
      const userData = storage.getUser();
      setUser(userData);

      /**
       * ステップ2: ブロックチェーンからスタンプを読み込む
       *
       * StampManager コントラクトの getUserStamps() 関数を使用して、
       * 現在のユーザー（account）が所有するスタンプのリストを取得します。
       *
       * 戻り値は Solidity の struct 配列で、以下の情報が含まれます：
       * - id: スタンプID（タイムスタンプ）
       * - name: スタンプ名
       * - organization: 発行組織
       * - category: カテゴリ
       * - issuedAt: 発行日時（Unix タイムスタンプ）
       */
      const userStamps = await stampManagerContract.getUserStamps(account);

      /**
       * ステップ2-1: スタンプデータを整形
       *
       * ブロックチェーンから取得したスタンプデータを、
       * フロントエンドで使用しやすい形式に変換します。
       * - issuedAt を Unix タイムスタンプから日付文字列に変換
       * - id を文字列形式に変換（一意のIDとして使用）
       */
      const formattedStamps = userStamps.map((stamp, index) => ({
        id: `stamp_${index}`, // 一意のID（URL パラメータとして使用）
        name: stamp.name, // スタンプ名
        organization: stamp.organization, // 発行組織
        category: stamp.category, // カテゴリ
        userAddress: account, // ユーザーアドレス（参加者数の計算に使用）
        issuedAt: new Date(Number(stamp.issuedAt) * 1000)
          .toISOString()
          .split("T")[0], // Unix タイムスタンプを日付文字列に変換（秒→ミリ秒→ISO形式→日付部分のみ）
      }));

      setStamps(formattedStamps);

      /**
       * ステップ2-2: ローカルストレージに保存（キャッシュ）
       *
       * ブロックチェーンから取得したスタンプデータをローカルストレージに保存します。
       * これにより、次回アクセス時にブロックチェーンへのリクエストを減らし、
       * パフォーマンスを向上させることができます。
       */
      if (formattedStamps.length > 0) {
        storage.saveStamps(formattedStamps);
      }

      /**
       * ステップ3: ブロックチェーンから NFT を読み込む
       *
       * NonFungibleCareerNFT コントラクトから以下の情報を取得します：
       * 1. 総供給量（getTotalSupply）を取得
       * 2. 各トークン ID について、所有者を確認
       * 3. 現在のユーザーが所有する NFT の詳細情報を取得
       */
      const totalSupply = await nftContract.getTotalSupply();
      const totalSupplyNumber = Number(totalSupply);
      const userNFTs = [];

      /**
       * ステップ3-1: ユーザーが所有する NFT を取得
       *
       * 総供給量分のトークン ID（0 から totalSupplyNumber - 1）について、
       * 各トークンの所有者を確認します。
       * 現在のユーザー（account）が所有者の場合、その NFT の詳細情報を取得します。
       */
      for (let i = 0; i < totalSupplyNumber; i++) {
        try {
          /**
           * トークンの所有者を取得
           *
           * ownerOf(tokenId) は ERC721 標準の関数で、
           * 指定されたトークン ID の所有者アドレスを返します。
           * トークンが存在しない場合はエラーが発生するため、try-catch で処理します。
           */
          const owner = await nftContract.ownerOf(i);

          /**
           * 所有者が現在のユーザーか確認
           *
           * ブロックチェーン上のアドレスは大文字・小文字を区別しないため、
           * toLowerCase() で比較します。
           */
          if (owner.toLowerCase() === account.toLowerCase()) {
            /**
             * NFT の詳細情報を取得
             *
             * ユーザーが所有する NFT の場合、以下の情報を取得します：
             * - getTokenName: NFT の名前（例: "優秀な成績証明書"）
             * - getTokenRarity: レアリティ（例: "Common", "Rare", "Epic", "Legendary"）
             * - getTokenOrganizations: 関連組織の配列（例: ["東京大学"]）
             */
            const tokenName = await nftContract.getTokenName(i);
            const rarity = await nftContract.getTokenRarity(i);
            const organizations = await nftContract.getTokenOrganizations(i);

            /**
             * NFT データを整形
             *
             * 取得した情報を、フロントエンドで使用しやすい形式に整形します。
             * ダッシュボードでは簡易的な情報のみを表示するため、
             * 詳細情報（tokenURI など）は取得していません。
             */
            userNFTs.push({
              id: `nft_${i}`, // 一意の ID（URL パラメータとして使用）
              tokenId: i, // トークン ID（ブロックチェーン上の ID）
              name: tokenName, // NFT の名前
              rarity: rarity.toLowerCase(), // レアリティ（小文字に変換）
              organizations: organizations, // 関連組織の配列
            });
          }
        } catch (err) {
          /**
           * エラーハンドリング: トークンが存在しない場合
           *
           * トークン ID が存在しない場合（例: バーンされたトークン）、
           * ownerOf() がエラーを投げます。
           * この場合は、そのトークンをスキップして次のトークンを処理します。
           */
          console.warn(`Token ${i} does not exist:`, err);
        }
      }

      setNfts(userNFTs);

      /**
       * ステップ3-2: ローカルストレージに保存（キャッシュ）
       *
       * ブロックチェーンから取得した NFT データをローカルストレージに保存します。
       * これにより、次回アクセス時にブロックチェーンへのリクエストを減らし、
       * パフォーマンスを向上させることができます。
       */
      if (userNFTs.length > 0) {
        storage.saveNFTs(userNFTs);
      }

      /**
       * ステップ4: 企業別のスタンプ数を集計
       *
       * ダッシュボードに表示する統計情報を計算します。
       * 各スタンプの organization をキーとして、スタンプ数をカウントします。
       * これにより、「次の目標」セクションで、どの企業からスタンプを集めるべきかが分かります。
       */
      const stats = {};
      formattedStamps.forEach((stamp) => {
        // 企業名がまだ stats オブジェクトに存在しない場合は初期化
        if (!stats[stamp.organization]) {
          stats[stamp.organization] = 0;
        }
        // スタンプ数をインクリメント
        stats[stamp.organization]++;
      });
      setOrganizationStats(stats);
    } catch (err) {
      /**
       * エラーハンドリング: ブロックチェーンからの読み込みに失敗した場合
       *
       * ネットワークエラーやコントラクトエラーが発生した場合、
       * ローカルストレージから読み込みを試みます。
       * エラーは警告として記録しますが、ユーザーには表示しません（フォールバックで対応）。
       */
      console.warn(
        "Warning: Could not load data from blockchain, falling back to storage:",
        err
      );
      // エラー時はローカルストレージから読み込む（フォールバック）
      // エラーメッセージは設定しない（フォールバックで対応するため）
      loadDataFromStorage();
    } finally {
      /**
       * ローディング状態を解除
       *
       * 成功・失敗に関わらず、ローディング状態を false に設定します。
       * これにより、ローディング表示が解除され、結果が表示されます。
       */
      setLoading(false);
    }
  }, [stampManagerContract, nftContract, account, loadDataFromStorage]);

  /**
   * ウォレット接続状態とコントラクト準備状態が変更されたときにデータを読み込む
   *
   * ウォレットが接続されていて、コントラクトが準備完了している場合、
   * ブロックチェーンからデータを読み込みます。
   * ウォレットが接続されていない場合は、ローカルストレージから読み込みます。
   */
  useEffect(() => {
    // コントラクトが準備できていない場合は待機（エラーを表示しない）
    if (!isReady) {
      setLoading(true);
      return;
    }

    if (isConnected && account) {
      // ブロックチェーンから読み込む
      loadData();
    } else {
      // ウォレット未接続時はローカルストレージから読み込む（フォールバック）
      loadDataFromStorage();
    }
  }, [isConnected, isReady, account, loadData, loadDataFromStorage]);

  /**
   * 次の目標を計算する関数
   *
   * 企業別のスタンプ数を確認し、3つ未満の企業を探します。
   * 見つかった最初の企業を「次の目標」として返します。
   *
   * NFT 証明書を取得するには、同一企業から3つ以上のスタンプが必要です。
   * この関数は、ユーザーが次にどの企業からスタンプを集めるべきかを示します。
   *
   * @returns {Object|null} 次の目標情報
   * @returns {string} organization - 企業名
   * @returns {number} current - 現在のスタンプ数
   * @returns {number} needed - 必要なスタンプ数（3 - current）
   * @returns {null} すべての企業で3つ以上のスタンプがある場合
   */
  const getNextGoal = () => {
    // 企業別のスタンプ数をループ処理
    for (const [org, count] of Object.entries(organizationStats)) {
      // 3つ未満の企業が見つかった場合
      if (count < 3) {
        return {
          organization: org, // 企業名
          current: count, // 現在のスタンプ数
          needed: 3 - count, // 必要なスタンプ数（3つに達するまで）
        };
      }
    }
    // すべての企業で3つ以上のスタンプがある場合
    return null;
  };

  // 次の目標を計算
  const nextGoal = getNextGoal();

  /**
   * 最近のスタンプを取得
   *
   * スタンプ配列の最後の3つを取得し、新しい順（逆順）に並べ替えます。
   * これにより、ダッシュボードに「最近のスタンプ」セクションを表示できます。
   */
  const recentStamps =
    stamps && stamps.length > 0 ? stamps.slice(-3).reverse() : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  /**
   * エラー表示は削除（空のデータでも表示を続ける）
   *
   * データが存在しない場合でも、エラー画面を表示せずに
   * 空の状態でダッシュボードを表示します。
   * これにより、新規ユーザーでもエラー画面が表示されません。
   */

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white overflow-hidden">
        {/* 装飾的な背景 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            {user?.name ||
              (account
                ? `${account.slice(0, 6)}...${account.slice(-4)}`
                : "ゲスト")}
            さん、こんにちは！
          </h1>
          <p className="text-blue-100 mb-6">あなたのキャリアパスポート</p>
          {!isConnected && (
            <div className="mb-4 bg-blue-500/20 backdrop-blur-sm rounded-lg p-3 border border-blue-300/30">
              <div className="text-blue-100 text-sm">
                💡
                ウォレットを接続すると、ブロックチェーンから最新のデータを取得できます
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
                <div>
                  <div className="text-sm text-blue-100">現在のスタンプ数</div>
                  <div className="text-4xl font-bold">{stamps.length} 枚</div>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <div className="text-sm text-blue-100">NFT 証明書</div>
                  <div className="text-4xl font-bold">{nfts.length} 枚</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 次の目標 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">次の目標</h2>
        </div>
        {nextGoal ? (
          <div className="space-y-4">
            <p className="text-gray-700 text-lg">
              <span className="font-bold text-gray-900">
                {nextGoal.organization}
              </span>
              認定 NFT まで
              <span className="font-bold text-blue-600 ml-2">
                あと {nextGoal.needed} スタンプ！
              </span>
            </p>
            <ProgressBar
              current={nextGoal.current}
              total={3}
              label={`${nextGoal.organization} スタンプ`}
            />
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-lg">すべての目標を達成しました！🎉</p>
            <p className="text-sm mt-2">
              新しいスタンプを集めて、さらに成長しましょう。
            </p>
          </div>
        )}
      </div>

      {/* 最近のスタンプ */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">🎫</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">最近のスタンプ</h2>
        </div>
        {recentStamps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentStamps.map((stamp) => (
              <StampCard key={stamp.id} stamp={stamp} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">まだスタンプがありません</p>
            <p className="text-sm">
              企業のイベントに参加してスタンプを集めましょう！
            </p>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/student/mypage"
          className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          <span className="flex items-center justify-center space-x-2">
            <span>マイページを見る</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </Link>
        <Link
          to="/student/nfts"
          className="group bg-white border-2 border-gray-300 text-gray-700 text-center py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg hover:border-blue-400 transform hover:-translate-y-1 transition-all duration-300"
        >
          <span className="flex items-center justify-center space-x-2">
            <span>NFT証明書を見る</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
