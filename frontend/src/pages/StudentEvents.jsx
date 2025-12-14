import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWalletConnect } from "../hooks/useWalletConnect";
import { eventAPI } from "../lib/api";
import { formatOrganization } from "../lib/utils";

export default function StudentEvents() {
  const { account, isConnected } = useWalletConnect();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationStatuses, setApplicationStatuses] = useState({}); // eventId => status

  useEffect(() => {
    loadEvents();
  }, []);

  /**
   * 各イベントの応募状況を読み込む
   */
  const loadApplicationStatuses = useCallback(async () => {
    if (!isConnected || !account) return;

    try {
      const response = await eventAPI.getMyApplications(account);
      if (response && response.ok && response.applications) {
        const statuses = {};
        response.applications.forEach((app) => {
          statuses[app.eventId] = app.status || "pending";
        });
        setApplicationStatuses(statuses);
      }
    } catch (err) {
      console.error("Error loading application statuses:", err);
    }
  }, [isConnected, account]);

  useEffect(() => {
    loadApplicationStatuses();
  }, [loadApplicationStatuses]);

  /**
   * イベント一覧を読み込む
   */
  const loadEvents = async () => {
    setLoading(true);

    try {
      // APIからイベント一覧を取得
      const response = await eventAPI.getAll();
      if (response.ok && response.events) {
        // イベントを表示用に整形
        const formattedEvents = response.events.map((event) => ({
          eventId: event.eventId,
          title: event.title,
          organization: event.orgWalletAddress || "企業",
          description: event.description || "",
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location || "",
          maxParticipants: event.maxParticipants,
          status:
            event.status === "active"
              ? "open"
              : event.status === "upcoming"
              ? "upcoming"
              : "closed",
        }));
        setEvents(formattedEvents);
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
  };

  /**
   * ステータスの表示名を取得
   */
  const getStatusLabel = (status) => {
    const labels = {
      pending: "審査中",
      approved: "承認済み",
      rejected: "拒否",
    };
    return labels[status] || status;
  };

  /**
   * ステータスのスタイルを取得
   */
  const getStatusStyle = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      approved: "bg-green-100 text-green-700 border-green-300",
      rejected: "bg-red-100 text-red-700 border-red-300",
    };
    return styles[status] || "bg-gray-100 text-gray-700 border-gray-300";
  };

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
            key={event.eventId}
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
                    : event.status === "upcoming"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {event.status === "open"
                  ? "募集中"
                  : event.status === "upcoming"
                  ? "開催予定"
                  : "終了"}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {event.title}
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-600">
                {formatOrganization(event.organization)}
              </span>
            </div>
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
              {isConnected && applicationStatuses[event.eventId] && (
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
                      applicationStatuses[event.eventId]
                    )}`}
                  >
                    {getStatusLabel(applicationStatuses[event.eventId])}
                  </span>
                </div>
              )}
            </div>

            {isConnected && applicationStatuses[event.eventId] ? (
              <Link
                to={`/student/events/${event.eventId}/apply`}
                className="block w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white text-center py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                応募状況を確認
              </Link>
            ) : (
              <Link
                to={`/student/events/${event.eventId}/apply`}
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                応募する
              </Link>
            )}
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
