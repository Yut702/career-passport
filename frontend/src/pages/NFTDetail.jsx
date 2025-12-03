import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import { storage } from "../lib/storage";

export default function NFTDetail() {
  const { id } = useParams();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        storage.initMockData();
        const nfts = storage.getNFTs();
        
        console.log("NFTDetail loaded data:", { nfts, id });
        
        const found = nfts.find((n) => n.id === id || n.tokenId === id);
        setNft(found || null);
        setLoading(false);
      } catch (err) {
        console.error("Error loading NFT:", err);
        setError("NFTの読み込みに失敗しました");
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-800 font-semibold mb-2">エラー</div>
          <div className="text-red-600">{error}</div>
          <Link
            to="/student/nfts"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            NFT 一覧に戻る
          </Link>
        </div>
      </StudentLayout>
    );
  }

  if (!nft) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">NFT が見つかりませんでした</p>
          <Link
            to="/student/nfts"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            NFT 一覧に戻る
          </Link>
        </div>
      </StudentLayout>
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
    <StudentLayout>
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
          <div className="text-center mb-8">
            <div
              className={`w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${getRarityGradient(
                nft.rarity
              )} flex items-center justify-center shadow-2xl`}
            >
              <span className="text-7xl">🏆</span>
            </div>
            <h1 className="text-4xl font-bold mb-3 text-gray-900">
              {nft.name}
            </h1>
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

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                この NFT で証明できること
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center space-x-2">
                  <span className="text-blue-600">•</span>
                  <span>金融業界での実務経験</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-600">•</span>
                  <span>投資分析の基礎知識</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-600">•</span>
                  <span>証券業務の理解</span>
                </li>
              </ul>
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
    </StudentLayout>
  );
}
