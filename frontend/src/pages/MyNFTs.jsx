import { useEffect, useState } from "react";
import StudentLayout from "../components/StudentLayout";
import NFTCard from "../components/NFTCard";
import { storage } from "../lib/storage";

export default function MyNFTs() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        storage.initMockData();
        const nftsData = storage.getNFTs();
        
        console.log("MyNFTs loaded data:", nftsData);
        
        setNfts(nftsData || []);
        setLoading(false);
      } catch (err) {
        console.error("Error loading NFTs:", err);
        setError("NFTの読み込みに失敗しました");
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🏆</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              所有 NFT 証明書
            </h1>
            <p className="text-gray-600 mt-1">あなたが取得した証明書一覧</p>
          </div>
        </div>

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
    </StudentLayout>
  );
}
