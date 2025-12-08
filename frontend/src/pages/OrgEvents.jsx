import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function OrgEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // モックデータ（実際の実装ではAPIから取得）
    const mockEvents = [
      {
        id: 1,
        title: "サマーインターンシップ 2025",
        description: "エンジニア向けのサマーインターンシップです。",
        startDate: "2025-07-01",
        endDate: "2025-08-31",
        status: "active",
        participants: 25,
      },
      {
        id: 2,
        title: "オープンキャンパス 2025",
        description: "企業説明会とワークショップを開催します。",
        startDate: "2025-06-15",
        endDate: "2025-06-15",
        status: "upcoming",
        participants: 0,
      },
    ];
    setEvents(mockEvents);
    setLoading(false);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              NFT発行イベント
            </h1>
            <p className="text-gray-600">
              NFT獲得イベントを作成・管理できます
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            + 新規イベント作成
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {event.status === "active" ? "開催中" : "開催予定"}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {event.title}
              </h3>
              <p className="text-gray-700 mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="text-sm text-gray-500 mb-4">
                <p>開催期間: {event.startDate} ～ {event.endDate}</p>
                <p className="mt-1">参加者数: {event.participants}人</p>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/org/events/${event.id}/collaborate`}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm"
                >
                  共同オファー
                </Link>
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                  編集
                </button>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">
              まだイベントを作成していません
            </p>
            <button className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              新規イベントを作成
            </button>
          </div>
        )}
      </div>
  );
}

