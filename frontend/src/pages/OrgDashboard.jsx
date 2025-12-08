import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storage } from "../lib/storage";

export default function OrgDashboard() {
  const [stats, setStats] = useState({
    totalStamps: 0,
    totalUsers: 0,
    totalNFTs: 0,
  });
  const [recentStamps, setRecentStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        storage.initMockData();
        const stamps = storage.getStamps();
        const nfts = storage.getNFTs();

        console.log("OrgDashboard loaded data:", { stamps, nfts });

        // 統計を計算
        const uniqueUsers = new Set(stamps.map((s) => s.id));
        setStats({
          totalStamps: stamps.length || 0,
          totalUsers: uniqueUsers.size || 0,
          totalNFTs: nfts.length || 0,
        });

        // 最近の発行（簡易版）
        setRecentStamps(stamps.slice(-5).reverse() || []);
        setLoading(false);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError("データの読み込みに失敗しました");
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">企業管理画面</h1>
            <p className="text-gray-600">スタンプ発行と統計管理</p>
          </div>
          <Link
            to="/org/stamp-issuance"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            🎫 スタンプを発行
          </Link>
        </div>

        {/* ダッシュボード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🎫</span>
              </div>
            </div>
            <div className="text-sm text-blue-100 mb-2">発行済みスタンプ</div>
            <div className="text-4xl font-bold">
              {stats.totalStamps} 枚
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-3xl">👥</span>
              </div>
            </div>
            <div className="text-sm text-green-100 mb-2">参加者数</div>
            <div className="text-4xl font-bold">
              {stats.totalUsers} 人
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🏆</span>
              </div>
            </div>
            <div className="text-sm text-purple-100 mb-2">NFT 発行数</div>
            <div className="text-4xl font-bold">
              {stats.totalNFTs} 枚
            </div>
          </div>
        </div>

        {/* 最近の発行 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">最近の発行</h2>
          </div>
          <div className="space-y-3">
            {recentStamps.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">
                  まだスタンプを発行していません
                </p>
              </div>
            ) : (
              recentStamps.map((stamp) => (
                <div
                  key={stamp.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🎫</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{stamp.name}</div>
                      <div className="text-sm text-gray-600">
                        {stamp.organization}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {new Date(stamp.issuedAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  );
}

