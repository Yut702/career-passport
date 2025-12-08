import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function StudentEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // モックデータ（実際の実装ではAPIから取得）
    const mockEvents = [
      {
        id: 1,
        title: "サマーインターンシップ 2025",
        organization: "株式会社テック",
        description: "エンジニア向けのサマーインターンシップです。",
        startDate: "2025-07-01",
        endDate: "2025-08-31",
        status: "open",
      },
      {
        id: 2,
        title: "オープンキャンパス 2025",
        organization: "株式会社イノベーション",
        description: "企業説明会とワークショップを開催します。",
        startDate: "2025-06-15",
        endDate: "2025-06-15",
        status: "open",
      },
      {
        id: 3,
        title: "ハッカソン大会",
        organization: "株式会社スタートアップ",
        description: "48時間でアプリを開発するハッカソンです。",
        startDate: "2025-09-01",
        endDate: "2025-09-03",
        status: "upcoming",
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
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NFT獲得イベント一覧
          </h1>
          <p className="text-gray-600">
            イベントに参加してスタンプを獲得し、NFT証明書を取得しましょう
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.status === "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {event.status === "open" ? "募集中" : "開催予定"}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {event.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {event.organization}
              </p>
              <p className="text-gray-700 mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="text-sm text-gray-500 mb-4">
                <p>開催期間: {event.startDate} ～ {event.endDate}</p>
              </div>

              <Link
                to={`/student/events/${event.id}/apply`}
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                応募する
              </Link>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">
              現在開催中のイベントはありません
            </p>
          </div>
        )}
      </div>
  );
}

