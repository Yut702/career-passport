import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrgLayout from "../components/OrgLayout";

export default function OrgDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const token = localStorage.getItem('org_token');
    if (!token) {
      navigate('/org-login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/org/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        localStorage.removeItem('org_token');
        navigate('/org-login');
        return;
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard');
      
      setDashboard(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('org_token');
    navigate('/org-login');
  };

  if (loading) {
    return (
      <OrgLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </OrgLayout>
    );
  }

  if (error) {
    return (
      <OrgLayout>
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
      </OrgLayout>
    );
  }

  return (
    <OrgLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">企業管理画面</h1>
            <p className="text-gray-600">組織ID: {dashboard.orgId}</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/org/stamp-issuance"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              🎫 スタンプを発行
            </Link>
            <button
              onClick={logout}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* ダッシュボードカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🎫</span>
              </div>
            </div>
            <div className="text-sm text-blue-100 mb-2">発行済みスタンプ</div>
            <div className="text-4xl font-bold">
              {dashboard.summary.totalStamps} 枚
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-3xl">👥</span>
              </div>
            </div>
            <div className="text-sm text-green-100 mb-2">参加者数</div>
            <div className="text-4xl font-bold">
              {dashboard.summary.totalParticipants} 名
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🏆</span>
              </div>
            </div>
            <div className="text-sm text-purple-100 mb-2">発行済みNFT</div>
            <div className="text-4xl font-bold">
              {dashboard.summary.totalNfts ?? 0} 枚
            </div>
          </div>
        </div>

        {/* イベント統計 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">イベント統計</h2>
          {dashboard.events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-500 text-lg">イベントデータがありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard.events.map((event) => (
                <div
                  key={event.eventId}
                  className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {event.eventId}</p>
                    </div>
                    {event.satisfactionScore !== null && (
                      <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold">
                        ★ {event.satisfactionScore.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-gray-600 text-sm mb-1">参加者数</div>
                      <div className="text-2xl font-bold text-green-600">
                        {event.participantCount}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 text-sm mb-1">スタンプ数</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {event.stampCount}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 text-sm mb-1">満足度</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {event.satisfactionScore !== null ? (
                          `${event.satisfactionScore.toFixed(1)}`
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OrgLayout>
  );
}
