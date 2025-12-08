import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { storage } from "../lib/storage";

export default function OrgNFTs() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNFTs = async () => {
      try {
        storage.initMockData();
        const nftsData = storage.getNFTs();
        // 企業が発行したNFTをフィルタリング（実際の実装ではAPIから取得）
        setNfts(nftsData || []);
        setLoading(false);
      } catch (err) {
        console.error("Error loading NFTs:", err);
        setLoading(false);
      }
    };

    loadNFTs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            所持NFT一覧
          </h1>
          <p className="text-gray-600">
            発行したNFT証明書の一覧を確認できます
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <Link
              key={nft.id}
              to={`/org/nft/${nft.id}`}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🏆</span>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  NFT #{nft.id}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {nft.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {nft.organization}
              </p>
              <p className="text-gray-700 text-sm line-clamp-2">
                {nft.description}
              </p>

              <div className="mt-4 text-sm text-gray-500">
                発行日:{" "}
                {new Date(nft.issuedAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </Link>
          ))}
        </div>

        {nfts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">
              まだNFTを発行していません
            </p>
            <Link
              to="/org/events"
              className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              NFT発行イベントを作成
            </Link>
          </div>
        )}
      </div>
  );
}

