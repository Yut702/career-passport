import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import ProgressBar from "../components/ProgressBar";
import StampCard from "../components/StampCard";
import { storage } from "../lib/storage";

export default function Home() {
  const [user, setUser] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [organizationStats, setOrganizationStats] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      storage.initMockData();
      const userData = storage.getUser();
      const stampsData = storage.getStamps();
      const nftsData = storage.getNFTs();

      setUser(userData);
      setStamps(stampsData);
      setNfts(nftsData);

      // 企業別のスタンプ数を集計
      const stats = {};
      stampsData.forEach((stamp) => {
        if (!stats[stamp.organization]) {
          stats[stamp.organization] = 0;
        }
        stats[stamp.organization]++;
      });
      setOrganizationStats(stats);
      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("データの読み込みに失敗しました");
      setLoading(false);
    }
  }, []);

  // 次の目標を計算（3つ未満の企業）
  const getNextGoal = () => {
    for (const [org, count] of Object.entries(organizationStats)) {
      if (count < 3) {
        return { organization: org, current: count, needed: 3 - count };
      }
    }
    return null;
  };

  const nextGoal = getNextGoal();
  const recentStamps = stamps.slice(-3).reverse();

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
        {/* ヘッダー */}
        <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white overflow-hidden">
          {/* 装飾的な背景 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">
              {user?.name || "ゲスト"}さん、こんにちは！
            </h1>
            <p className="text-blue-100 mb-6">あなたのキャリアパスポート</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎫</span>
                  </div>
                  <div>
                    <div className="text-sm text-blue-100">
                      現在のスタンプ数
                    </div>
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
        {nextGoal && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">次の目標</h2>
            </div>
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
          </div>
        )}

        {/* 最近のスタンプ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">最近のスタンプ</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentStamps.map((stamp) => (
              <StampCard key={stamp.id} stamp={stamp} />
            ))}
          </div>
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
    </StudentLayout>
  );
}
