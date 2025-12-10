import { useEffect, useState, useCallback } from "react";
import StampCard from "../components/StampCard";
import ProgressBar from "../components/ProgressBar";
import NFTCard from "../components/NFTCard";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";

/**
 * マイページ（ユーザー向け）
 *
 * ブロックチェーンからスタンプを読み込み、NFT発行機能を提供します。
 * 同一組織から3つ以上のスタンプがある場合、NFT証明書に交換できます。
 */
export default function MyPage() {
  const { nftContract, stampManagerContract, isReady } = useContracts();
  const { account, isConnected } = useWallet();
  const [nfts, setNfts] = useState([]);
  const [organizationGroups, setOrganizationGroups] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [mintingOrg, setMintingOrg] = useState(null);

  /**
   * ブロックチェーンからスタンプを読み込む
   */
  const loadStamps = useCallback(async () => {
    if (!stampManagerContract || !account) return;

    try {
      // ブロックチェーンからユーザーのスタンプを取得
      const userStamps = await stampManagerContract.getUserStamps(account);

      // スタンプデータを整形（SolidityのstructをJavaScriptオブジェクトに変換）
      const formattedStamps = userStamps.map((stamp) => ({
        id: stamp.id.toString(),
        name: stamp.name,
        organization: stamp.organization,
        category: stamp.category,
        issuedAt: new Date(Number(stamp.issuedAt) * 1000)
          .toISOString()
          .split("T")[0],
      }));

      // 企業別にグループ化
      const groups = {};
      formattedStamps.forEach((stamp) => {
        if (!groups[stamp.organization]) {
          groups[stamp.organization] = [];
        }
        groups[stamp.organization].push(stamp);
      });
      setOrganizationGroups(groups);
    } catch (error) {
      console.error("Error loading stamps:", error);
      setError("スタンプの読み込みに失敗しました");
    }
  }, [stampManagerContract, account]);

  /**
   * ブロックチェーンからNFTを読み込む
   */
  const loadNFTs = useCallback(async () => {
    if (!nftContract || !account) return;

    try {
      // 総供給量を取得
      const totalSupply = await nftContract.getTotalSupply();

      // すべてのNFTを確認して、ユーザーが所有するものを取得
      const userNFTs = [];
      for (let i = 0; i < Number(totalSupply); i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const tokenURI = await nftContract.tokenURI(i);
            const tokenName = await nftContract.getTokenName(i);
            const rarity = await nftContract.getTokenRarity(i);
            const organizations = await nftContract.getTokenOrganizations(i);

            userNFTs.push({
              id: i.toString(),
              tokenId: i,
              name: tokenName,
              uri: tokenURI,
              rarity,
              organizations: organizations,
            });
          }
        } catch {
          // トークンが存在しない場合はスキップ
          continue;
        }
      }

      setNfts(userNFTs);
    } catch (error) {
      console.error("Error loading NFTs:", error);
    }
  }, [nftContract, account]);

  /**
   * データを読み込む
   */
  useEffect(() => {
    const loadData = async () => {
      if (!isConnected || !isReady || !account) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([loadStamps(), loadNFTs()]);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("データの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isConnected, isReady, account, loadStamps, loadNFTs]);

  /**
   * NFT発行可能かチェック
   *
   * @param {string} org - 組織名
   * @param {number} count - スタンプ数
   * @returns {boolean} NFT発行可能かどうか
   */
  const canMintNFT = (org, count) => count >= 3;

  /**
   * NFTを発行する関数
   *
   * @param {string} organization - 組織名
   */
  const handleMintNFT = async (organization) => {
    if (!nftContract || !account) return;

    setMinting(true);
    setMintingOrg(organization);
    setError(null);

    try {
      // NFT を発行
      // mint(address to, string memory tokenURI, string memory name, string memory rarity, string[] memory organizations)
      const tx = await nftContract.mint(
        account,
        `https://example.com/metadata/${Date.now()}.json`,
        `${organization} 優秀な成績証明書`,
        "Rare",
        [organization]
      );

      // トランザクションの確認を待つ
      await tx.wait();

      // 成功メッセージ
      alert("NFT が正常に発行されました！");

      // データを再読み込み
      await Promise.all([loadStamps(), loadNFTs()]);
    } catch (error) {
      console.error("Error minting NFT:", error);

      let errorMessage = "NFT 発行に失敗しました";
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setMinting(false);
      setMintingOrg(null);
    }
  };

  // ウォレットが接続されていない場合の表示
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold text-lg">
            ウォレットを接続してください
          </p>
          <p className="text-red-500 mt-2">
            スタンプを確認するには、MetaMask
            などのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (
    (error && !organizationGroups) ||
    Object.keys(organizationGroups).length === 0
  ) {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-3xl">💼</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">マイスタンプ</h1>
          <p className="text-gray-600 mt-1">あなたのスタンプコレクション</p>
        </div>
      </div>

      {/* 企業別スタンプ */}
      <div className="space-y-6">
        {Object.keys(organizationGroups).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="text-8xl mb-6">📭</div>
            <p className="text-gray-700 text-xl font-semibold mb-2">
              まだスタンプがありません
            </p>
            <p className="text-gray-500 text-base">
              企業のイベントに参加してスタンプを集めましょう！
            </p>
          </div>
        ) : (
          Object.entries(organizationGroups).map(([org, orgStamps]) => {
            const count = orgStamps.length;
            const canMint = canMintNFT(org, count);

            return (
              <div
                key={org}
                className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {org}
                    </h2>
                    <p className="text-gray-600">スタンプ {count}/3</p>
                  </div>
                  {canMint && (
                    <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                      ✨ NFT 交換可能！
                    </span>
                  )}
                </div>
                <div className="mb-6">
                  <ProgressBar current={count} total={3} label="" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {orgStamps.map((stamp) => (
                    <StampCard key={stamp.id} stamp={stamp} />
                  ))}
                  {Array.from({ length: 3 - count }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[120px]"
                    >
                      <span className="text-gray-300 text-4xl mb-2">⬜</span>
                      <span className="text-gray-400 text-xs">未取得</span>
                    </div>
                  ))}
                </div>
                {canMint && (
                  <button
                    onClick={() => handleMintNFT(org)}
                    disabled={minting || !isReady || mintingOrg === org}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {minting && mintingOrg === org
                      ? "⏳ 発行中..."
                      : "🏆 NFT 証明書に交換する"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-semibold">エラー</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* 取得したNFT証明書 */}
      {nfts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              取得した NFT 証明書
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
