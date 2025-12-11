import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { storage } from "../lib/storage";

/**
 * NFT 詳細ページ（ユーザー向け）
 *
 * ブロックチェーンから特定の NFT の詳細情報を読み込み、表示します。
 * ウォレットが接続されていない場合は、ローカルストレージから読み込みます（フォールバック）。
 */
export default function NFTDetail() {
  // URL パラメータから NFT ID を取得
  const { id } = useParams();
  // コントラクトインスタンスを取得
  const { nftContract, isReady } = useContracts();
  // ウォレット接続状態を取得
  const { account, isConnected } = useWallet();

  // 状態管理
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * ローカルストレージから NFT を読み込む関数（フォールバック）
   *
   * ウォレットが接続されていない場合や、ブロックチェーンからの読み込みに失敗した場合に使用します。
   * ローカルストレージに保存された NFT データを読み込み、表示します。
   *
   * useCallback でメモ化することで、関数の再作成を防ぎます。
   * この関数は依存関係がないため、常に同じ関数インスタンスを返します。
   *
   * @async
   * @returns {Promise<void>}
   */
  const loadNFTFromStorage = useCallback(() => {
    try {
      /**
       * ローカルストレージから NFT データを取得
       *
       * storage.getNFTs() は、ローカルストレージに保存された NFT の配列を返します。
       * URL パラメータの id と一致する NFT を検索します。
       */
      const nfts = storage.getNFTs();
      const nftData = nfts.find((n) => n.id === id);

      if (nftData) {
        // NFT データが見つかった場合
        setNft(nftData);
      } else {
        // NFT データが見つからない場合
        setError("NFTが見つかりません");
      }
    } catch (err) {
      /**
       * エラーハンドリング: ローカルストレージからの読み込みに失敗した場合
       *
       * ローカルストレージが無効な場合や、データが破損している場合にエラーが発生します。
       */
      console.error("Error loading NFT from storage:", err);
      setError("NFTの読み込みに失敗しました");
    } finally {
      /**
       * ローディング状態を解除
       */
      setLoading(false);
    }
  }, [id]);

  /**
   * ブロックチェーンから NFT の詳細情報を読み込む関数
   *
   * NonFungibleCareerNFT コントラクトから以下の情報を取得します：
   * 1. トークン URI（メタデータの場所）
   * 2. トークン名
   * 3. レアリティ
   * 4. 関連組織の配列
   * 5. 所有者アドレス
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
   * @throws {Error} トークン ID が無効な場合
   * @throws {Error} ブロックチェーンからの読み込みに失敗した場合
   */
  const loadNFT = useCallback(async () => {
    // コントラクトと ID が存在しない場合は処理を中断
    if (!nftContract || !id) return;

    setLoading(true);
    setError(null);

    try {
      /**
       * ステップ1: トークン ID を取得（URL パラメータから）
       *
       * URL パラメータの id は "nft_0" のような形式です。
       * "nft_" プレフィックスを削除して、数値のトークン ID を取得します。
       * 例: "nft_0" → 0, "nft_123" → 123
       */
      const tokenId = parseInt(id.replace("nft_", ""));

      /**
       * ステップ2: NFT の詳細情報を取得
       *
       * NonFungibleCareerNFT コントラクトの以下の関数を使用して、
       * NFT の詳細情報を取得します：
       * - tokenURI(tokenId): メタデータ（画像、説明など）の URI
       * - getTokenName(tokenId): NFT の名前（例: "優秀な成績証明書"）
       * - getTokenRarity(tokenId): レアリティ（例: "Common", "Rare", "Epic", "Legendary"）
       * - getTokenOrganizations(tokenId): 関連組織の配列（例: ["東京大学"]）
       * - ownerOf(tokenId): 所有者アドレス（ERC721 標準関数）
       */
      const tokenURI = await nftContract.tokenURI(tokenId);
      const tokenName = await nftContract.getTokenName(tokenId);
      const rarity = await nftContract.getTokenRarity(tokenId);
      const organizations = await nftContract.getTokenOrganizations(tokenId);
      const owner = await nftContract.ownerOf(tokenId);

      /**
       * ステップ3: NFT データを整形
       *
       * 取得した情報を、フロントエンドで使用しやすい形式に整形します。
       * NFT 詳細ページで使用するために、必要なフィールドを設定します。
       */
      const nftData = {
        id: `nft_${tokenId}`, // 一意の ID（URL パラメータとして使用）
        tokenId: tokenId, // トークン ID（ブロックチェーン上の ID）
        name: tokenName, // NFT の名前
        description: "", // 説明（メタデータから取得する場合は tokenURI を使用）
        rarity: rarity.toLowerCase(), // レアリティ（小文字に変換）
        organizations: organizations, // 関連組織の配列
        contractAddress: nftContract.target, // コントラクトアドレス
        transactionHash: "", // トランザクションハッシュ（必要に応じて取得）
        metadataURI: tokenURI, // メタデータ URI
        owner: owner, // 所有者アドレス
        mintedAt: new Date().toISOString().split("T")[0], // 発行日（簡易版、実際はブロックタイムスタンプから取得可能）
      };

      setNft(nftData);

      /**
       * ステップ4: ローカルストレージに保存（キャッシュ）
       *
       * ブロックチェーンから取得したデータをローカルストレージに保存します。
       * 既存の NFT データがある場合は更新し、ない場合は追加します。
       * これにより、次回アクセス時にブロックチェーンへのリクエストを減らし、
       * パフォーマンスを向上させることができます。
       */
      const nfts = storage.getNFTs();
      const existingIndex = nfts.findIndex((n) => n.id === nftData.id);
      if (existingIndex >= 0) {
        // 既存の NFT データを更新
        nfts[existingIndex] = nftData;
      } else {
        // 新しい NFT データを追加
        nfts.push(nftData);
      }
      storage.saveNFTs(nfts);
    } catch (err) {
      /**
       * エラーハンドリング: ブロックチェーンからの読み込みに失敗した場合
       *
       * ネットワークエラーやコントラクトエラーが発生した場合、
       * エラーメッセージを設定し、ローカルストレージから読み込みを試みます。
       * トークンが存在しない場合（無効なトークン ID）もここで処理されます。
       */
      console.error("Error loading NFT:", err);
      setError("NFTの読み込みに失敗しました");
      // エラー時はローカルストレージから読み込む（フォールバック）
      loadNFTFromStorage();
    } finally {
      /**
       * ローディング状態を解除
       *
       * 成功・失敗に関わらず、ローディング状態を false に設定します。
       * これにより、ローディング表示が解除され、結果が表示されます。
       */
      setLoading(false);
    }
  }, [nftContract, id, loadNFTFromStorage]);

  /**
   * ウォレット接続状態とコントラクト準備状態が変更されたときにデータを読み込む
   *
   * ウォレットが接続されていて、コントラクトが準備完了している場合、
   * ブロックチェーンから NFT の詳細情報を読み込みます。
   * ウォレットが接続されていない場合は、ローカルストレージから読み込みます。
   */
  useEffect(() => {
    if (isConnected && isReady && account && id) {
      // ブロックチェーンから読み込む
      loadNFT();
    } else if (!isConnected && id) {
      // ウォレット未接続時はローカルストレージから読み込む（フォールバック）
      loadNFTFromStorage();
    }
  }, [isConnected, isReady, account, id, loadNFT, loadNFTFromStorage]);

  /**
   * ローディング表示
   *
   * データの読み込み中は、ローディングメッセージを表示します。
   */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  /**
   * エラー表示（NFT が存在しない場合）
   *
   * エラーが発生し、かつ NFT が存在しない場合は、
   * エラーメッセージと再読み込みボタンを表示します。
   */
  if (error && !nft) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-semibold mb-2">エラー</div>
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          再読み込み
        </button>
        <Link
          to="/student/nfts"
          className="text-blue-600 hover:underline mt-4 inline-block ml-4"
        >
          NFT 一覧に戻る
        </Link>
      </div>
    );
  }

  /**
   * NFT が見つからない場合の表示
   *
   * エラーは発生していないが、NFT データが存在しない場合に表示します。
   */
  if (!nft) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-gray-800 font-semibold mb-2">
          NFT が見つかりません
        </div>
        <Link
          to="/student/nfts"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          NFT 一覧に戻る
        </Link>
      </div>
    );
  }

  const getRarityColor = (rarity) => {
    const colors = {
      common: "bg-gray-200 text-gray-800",
      rare: "bg-blue-200 text-blue-800",
      epic: "bg-purple-200 text-purple-800",
      legendary: "bg-yellow-200 text-yellow-800",
    };
    return colors[rarity] || colors.common;
  };

  const getRarityGradient = (rarity) => {
    const gradients = {
      common: "from-gray-400 to-gray-600",
      rare: "from-blue-400 to-blue-600",
      epic: "from-purple-400 to-purple-600",
      legendary: "from-yellow-400 via-orange-400 to-red-500",
    };
    return gradients[rarity] || gradients.common;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/student/nfts"
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span>NFT 一覧に戻る</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
        {/* エラー警告（データが存在する場合） */}
        {error && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-800 text-sm">
              ⚠️ {error}（ローカルストレージのデータを表示しています）
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div
            className={`w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${getRarityGradient(
              nft.rarity
            )} flex items-center justify-center shadow-2xl`}
          >
            <span className="text-7xl">🏆</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 text-gray-900">{nft.name}</h1>
          <div
            className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-bold border-2 ${getRarityColor(
              nft.rarity
            )}`}
          >
            <span className="mr-2">
              {nft.rarity === "legendary"
                ? "⭐⭐⭐⭐"
                : nft.rarity === "epic"
                ? "⭐⭐⭐"
                : nft.rarity === "rare"
                ? "⭐⭐"
                : "⭐"}
            </span>
            {nft.rarity.toUpperCase()}
          </div>
        </div>

        <div className="space-y-6 border-t border-gray-200 pt-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              発行日
            </h3>
            <p className="text-gray-700 font-medium">
              {new Date(nft.mintedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              関連企業
            </h3>
            <p className="text-gray-700 font-medium">
              {nft.organizations.join(" / ")}
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              取得条件
            </h3>
            <ul className="space-y-3">
              {nft.stampIds.map((stampId) => {
                const stamps = storage.getStamps();
                const stamp = stamps.find((s) => s.id === stampId);
                return (
                  <li
                    key={stampId}
                    className="flex items-center space-x-3 bg-white rounded-lg p-3"
                  >
                    <span className="text-2xl">✅</span>
                    <span className="text-gray-700 font-medium">
                      {stamp
                        ? `${stamp.organization} ${stamp.name}`
                        : `スタンプ ${stampId}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* トークン ID とコントラクト情報 */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                />
              </svg>
              ブロックチェーン情報
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">トークン ID</p>
                <p className="text-gray-900 font-mono font-semibold">
                  {nft.tokenId}
                </p>
              </div>
              {nft.contractAddress && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    コントラクトアドレス
                  </p>
                  <p className="text-gray-900 font-mono text-sm break-all">
                    {nft.contractAddress}
                  </p>
                </div>
              )}
              {nft.owner && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">所有者</p>
                  <p className="text-gray-900 font-mono text-sm break-all">
                    {nft.owner}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex space-x-4">
          <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            📤 共有する
          </button>
          <button className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition border-2 border-gray-200">
            🔍 詳細を見る
          </button>
        </div>
      </div>
    </div>
  );
}
