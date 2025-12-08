import { useEffect, useState } from "react";
import StampCard from "../components/StampCard";
import ProgressBar from "../components/ProgressBar";
import NFTCard from "../components/NFTCard";
import { storage } from "../lib/storage";

export default function MyPage() {
  const [nfts, setNfts] = useState([]);
  const [organizationGroups, setOrganizationGroups] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        storage.initMockData();
        const allStamps = storage.getStamps();
        const allNFTs = storage.getNFTs();

        console.log("MyPage loaded data:", { allStamps, allNFTs });

        setNfts(allNFTs || []);

        // 企業別にグループ化
        const groups = {};
        if (allStamps && allStamps.length > 0) {
          allStamps.forEach((stamp) => {
            if (!groups[stamp.organization]) {
              groups[stamp.organization] = [];
            }
            groups[stamp.organization].push(stamp);
          });
        }
        setOrganizationGroups(groups);
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("データの読み込みに失敗しました");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const canMintNFT = (org, count) => count >= 3;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
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
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    🏆 NFT 証明書に交換する
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

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
