import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storage } from "../lib/storage";

export default function OrgNFTDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNFT = async () => {
      try {
        const nfts = storage.getNFTs();
        const foundNFT = nfts.find((n) => n.id === parseInt(id));
        setNft(foundNFT);
        setLoading(false);
      } catch (err) {
        console.error("Error loading NFT:", err);
        setLoading(false);
      }
    };

    loadNFT();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">NFTが見つかりません</p>
        <button
          onClick={() => navigate("/org/nfts")}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          NFT一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/org/nfts")}
        className="mb-6 text-purple-600 hover:text-purple-700 flex items-center space-x-2"
      >
        <span>←</span>
        <span>NFT一覧に戻る</span>
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {nft.name}
            </h1>
            <p className="text-gray-600 text-lg">{nft.organization}</p>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-5xl">🏆</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">説明</h3>
            <p className="text-gray-700">{nft.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">NFT ID</div>
              <div className="text-2xl font-bold text-purple-700">
                #{nft.id}
              </div>
            </div>
            <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">発行日</div>
              <div className="text-lg font-bold text-purple-700">
                {new Date(nft.issuedAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          {nft.stamps && nft.stamps.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                関連スタンプ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nft.stamps.map((stamp, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="font-medium text-gray-900">
                      {stamp.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stamp.organization}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
