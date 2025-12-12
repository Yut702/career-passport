import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { eventAPI } from "../lib/api";

export default function OrgEvents() {
  const navigate = useNavigate();
  const { account, isConnected } = useWallet();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationCounts, setApplicationCounts] = useState({});

  /**
   * イベント一覧と応募数を読み込む
   */
  const loadEvents = useCallback(async () => {
    setLoading(true);

    try {
      // ログイン中のウォレットアドレスを使用
      const orgWalletAddress = isConnected && account ? account : null;

      // APIからイベント一覧を取得（ウォレットが接続されている場合のみ企業のイベントを取得）
      const response = await eventAPI.getAll(orgWalletAddress);
      if (response.ok && response.events) {
        setEvents(response.events);

        // 各イベントの応募数を取得
        const counts = {};
        for (const event of response.events) {
          try {
            const appResponse = await eventAPI.getEventApplications(
              event.eventId
            );
            if (appResponse.ok && appResponse.applications) {
              counts[event.eventId] = appResponse.applications.length;
            } else {
              counts[event.eventId] = 0;
            }
          } catch (err) {
            console.error(
              `Error loading applications for event ${event.eventId}:`,
              err
            );
            counts[event.eventId] = 0;
          }
        }
        setApplicationCounts(counts);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Error loading events:", err);
      // エラー時は空配列を設定
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, account]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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
          <p className="text-gray-600">NFT獲得イベントを作成・管理できます</p>
        </div>
        <Link
          to="/org/events/create"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          + 新規イベント作成
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div
            key={event.eventId}
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
                    : event.status === "upcoming"
                    ? "bg-blue-100 text-blue-700"
                    : event.status === "completed"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {event.status === "active"
                  ? "開催中"
                  : event.status === "upcoming"
                  ? "開催予定"
                  : event.status === "completed"
                  ? "終了"
                  : "キャンセル"}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {event.title}
            </h3>
            <p className="text-gray-700 mb-4 line-clamp-2">
              {event.description || "説明なし"}
            </p>

            <div className="text-sm text-gray-500 mb-4">
              <p>
                開催期間: {event.startDate} ～ {event.endDate}
              </p>
              {event.location && <p className="mt-1">場所: {event.location}</p>}
              {event.maxParticipants && (
                <p className="mt-1">最大参加者数: {event.maxParticipants}人</p>
              )}
              <p className="mt-1">
                応募数: {applicationCounts[event.eventId] || 0}件
              </p>
            </div>

            <div className="flex space-x-2">
              <Link
                to={`/org/events/${event.eventId}/applications`}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm"
              >
                応募を確認
                {applicationCounts[event.eventId] > 0 && (
                  <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
                    {applicationCounts[event.eventId]}
                  </span>
                )}
              </Link>
              <Link
                to={`/org/events/${event.eventId}/collaborate`}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm"
              >
                共同オファー
              </Link>
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
          <button
            onClick={() => navigate("/org/events/create")}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            新規イベントを作成
          </button>
        </div>
      )}
    </div>
  );
}
