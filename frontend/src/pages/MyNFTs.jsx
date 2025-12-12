import { useEffect, useState, useCallback } from "react";
import NFTCard from "../components/NFTCard";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { storage } from "../lib/storage";

/**
 * NFT 一覧ページ（ユーザー向け）
 *
 * ブロックチェーンからユーザーが所有する NFT 証明書を読み込み、一覧表示します。
 * ウォレットが接続されていない場合は、ローカルストレージから読み込みます（フォールバック）。
 */
export default function MyNFTs() {
  // コントラクトインスタンスを取得
  const { nftContract, isReady } = useContracts();
  // ウォレット接続状態を取得
  const { account, isConnected } = useWallet();

  // 状態管理
  const [nfts, setNfts] = useState([]);
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
  const loadNFTsFromStorage = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const nftsData = storage.getNFTs();
      setNfts(nftsData || []);
    } catch (err) {
      console.error("Error loading NFTs from storage:", err);
      setError("ローカルストレージからのNFT読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ブロックチェーンから NFT を読み込む関数
   *
   * NonFungibleCareerNFT コントラクトから以下の情報を取得します：
   * 1. 総供給量（totalSupply）を取得
   * 2. 各トークン ID について、所有者を確認
   * 3. 現在のユーザーが所有する NFT の詳細情報を取得
   *    - トークン URI（メタデータの場所）
   *    - トークン名
   *    - レアリティ
   *    - 関連組織
   * 4. 取得した NFT をローカルストレージに保存（キャッシュ）
   *
   * useCallback でメモ化することで、依存関係が変更されない限り
   * 関数の再作成を防ぎ、パフォーマンスを向上させます。
   *
   * @async
   * @returns {Promise<void>}
   * @throws {Error} コントラクトが読み込まれていない場合
   * @throws {Error} ブロックチェーンからの読み込みに失敗した場合
   */
  const loadNFTs = useCallback(async () => {
    // コントラクトとアカウントが存在しない場合は処理を中断
    if (!nftContract || !account) return;

    setLoading(true);
    setError(null);

    try {
      /**
       * ステップ1: 総供給量を取得
       *
       * getTotalSupply() は NonFungibleCareerNFT コントラクトの関数で、
       * 現在までに発行された NFT の総数を返します。
       * この値を使って、すべてのトークン ID をループ処理します。
       */
      const totalSupply = await nftContract.getTotalSupply();
      const totalSupplyNumber = Number(totalSupply);

      /**
       * ステップ2: ユーザーが所有する NFT のトークン ID を取得
       *
       * 総供給量分のトークン ID（0 から totalSupplyNumber - 1）について、
       * 各トークンの所有者を確認します。
       * 現在のユーザー（account）が所有者の場合、その NFT の詳細情報を取得します。
       */
      const userNFTs = [];

      for (let i = 0; i < totalSupplyNumber; i++) {
        try {
          /**
           * ステップ2-1: トークンの所有者を取得
           *
           * ownerOf(tokenId) は ERC721 標準の関数で、
           * 指定されたトークン ID の所有者アドレスを返します。
           * トークンが存在しない場合はエラーが発生するため、try-catch で処理します。
           */
          const owner = await nftContract.ownerOf(i);

          /**
           * ステップ2-2: 所有者が現在のユーザーか確認
           *
           * ブロックチェーン上のアドレスは大文字・小文字を区別しないため、
           * toLowerCase() で比較します。
           */
          if (owner.toLowerCase() === account.toLowerCase()) {
            /**
             * ステップ2-3: NFT の詳細情報を取得
             *
             * ユーザーが所有する NFT の場合、以下の情報を取得します：
             * - tokenURI: メタデータ（画像、説明など）の URI
             * - getTokenName: NFT の名前（例: "優秀な成績証明書"）
             * - getTokenRarity: レアリティ（例: "Common", "Rare", "Epic", "Legendary"）
             * - getTokenOrganizations: 関連組織の配列（例: ["東京大学"]）
             */
            const tokenURI = await nftContract.tokenURI(i);
            const tokenName = await nftContract.getTokenName(i);
            const rarity = await nftContract.getTokenRarity(i);
            const organizations = await nftContract.getTokenOrganizations(i);

            /**
             * ステップ2-4: NFT データを整形
             *
             * 取得した情報を、フロントエンドで使用しやすい形式に整形します。
             * NFTCard コンポーネントで使用するために、必要なフィールドを設定します。
             */
            userNFTs.push({
              id: `nft_${i}`, // 一意の ID（URL パラメータとして使用）
              tokenId: i, // トークン ID（ブロックチェーン上の ID）
              name: tokenName, // NFT の名前
              description: "", // 説明（メタデータから取得する場合は tokenURI を使用）
              rarity: rarity.toLowerCase(), // レアリティ（小文字に変換）
              organizations: organizations, // 関連組織の配列
              contractAddress: nftContract.target, // コントラクトアドレス
              transactionHash: "", // トランザクションハッシュ（必要に応じて取得）
              metadataURI: tokenURI, // メタデータ URI
              mintedAt: new Date().toISOString().split("T")[0], // 発行日（簡易版、実際はブロックタイムスタンプから取得可能）
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

      /**
       * ステップ3: 取得した NFT を状態に設定
       *
       * ユーザーが所有する NFT のリストを状態に保存します。
       * これにより、コンポーネントが再レンダリングされ、NFT 一覧が表示されます。
       */
      setNfts(userNFTs);

      /**
       * ステップ4: ローカルストレージに保存（キャッシュ）
       *
       * ブロックチェーンから取得したデータをローカルストレージに保存します。
       * これにより、次回アクセス時にブロックチェーンへのリクエストを減らし、
       * パフォーマンスを向上させることができます。
       * また、ウォレットが接続されていない場合のフォールバックとしても機能します。
       */
      if (userNFTs.length > 0) {
        storage.saveNFTs(userNFTs);
      }
    } catch (err) {
      /**
       * エラーハンドリング: ブロックチェーンからの読み込みに失敗した場合
       *
       * ネットワークエラーやコントラクトエラーが発生した場合、
       * エラーメッセージを設定し、ローカルストレージから読み込みを試みます。
       */
      console.error("Error loading NFTs:", err);
      setError("NFTの読み込みに失敗しました");
      // エラー時はローカルストレージから読み込む（フォールバック）
      loadNFTsFromStorage();
    } finally {
      /**
       * ローディング状態を解除
       *
       * 成功・失敗に関わらず、ローディング状態を false に設定します。
       * これにより、ローディング表示が解除され、結果が表示されます。
       */
      setLoading(false);
    }
  }, [nftContract, account, loadNFTsFromStorage]);

  /**
   * ウォレット接続状態とコントラクト準備状態が変更されたときにデータを読み込む
   *
   * ウォレットが接続されていて、コントラクトが準備完了している場合、
   * ブロックチェーンから NFT を読み込みます。
   * ウォレットが接続されていない場合は、ローカルストレージから読み込みます。
   */
  useEffect(() => {
    if (isConnected && isReady && account) {
      // ブロックチェーンから読み込む
      loadNFTs();
    } else if (!isConnected) {
      // ウォレット未接続時はローカルストレージから読み込む（フォールバック）
      loadNFTsFromStorage();
    }
  }, [isConnected, isReady, account, loadNFTs, loadNFTsFromStorage]);

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
   * エラー表示（データが存在しない場合）
   *
   * エラーが発生し、かつ NFT が存在しない場合は、エラーメッセージと再読み込みボタンを表示します。
   */
  if (error && nfts.length === 0) {
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
      </div>
    );
  }

  /**
   * メインコンテンツ
   *
   * NFT 一覧を表示します。
   * NFT が存在しない場合は、空の状態メッセージを表示します。
   */
  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-3xl">🏆</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">所有 NFT 証明書</h1>
          <p className="text-gray-600 mt-1">あなたが取得した証明書一覧</p>
        </div>
      </div>

      {/* エラー警告（データが存在する場合） */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800 text-sm">
            ⚠️ {error}（ローカルストレージのデータを表示しています）
          </div>
        </div>
      )}

      {/* NFT 一覧または空の状態 */}
      {nfts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
          <div className="text-8xl mb-6">📭</div>
          <p className="text-gray-700 text-xl font-semibold mb-2">
            まだ NFT 証明書を取得していません
          </p>
          <p className="text-gray-500 text-base">
            スタンプを 3 つ集めて NFT 証明書を取得しましょう！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}
