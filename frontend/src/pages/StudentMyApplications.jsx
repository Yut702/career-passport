import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWalletConnect } from "../hooks/useWalletConnect";
import { eventAPI } from "../lib/api";
import { storage } from "../lib/storage";

/**
 * 応募一覧ページ（ユーザー向け）
 *
 * ユーザーが送ったすべての応募を表示し、ステータス（承認、拒否、審査中）を確認できるページです。
 */
export default function StudentMyApplications() {
  const { account, isConnected } = useWalletConnect();
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState({}); // eventId -> event のマップ
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * 応募一覧を読み込む
   */
  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await eventAPI.getMyApplications(account);
      if (response && response.ok && response.applications) {
        // 応募日時でソート（新しい順）
        const sorted = response.applications.sort((a, b) => {
          const dateA = new Date(a.appliedAt || 0);
          const dateB = new Date(b.appliedAt || 0);
          return dateB - dateA;
        });
        setApplications(sorted);

        // 各応募のイベント情報を取得
        const eventIds = [...new Set(sorted.map((app) => app.eventId))];
        const eventPromises = eventIds.map(async (eventId) => {
          try {
            const eventResponse = await eventAPI.getById(eventId);
            if (eventResponse && eventResponse.ok && eventResponse.event) {
              return { eventId, event: eventResponse.event };
            }
          } catch (err) {
            console.error(`Error loading event ${eventId}:`, err);
          }
          return null;
        });

        const eventResults = await Promise.all(eventPromises);
        const eventsMap = {};
        eventResults.forEach((result) => {
          if (result) {
            eventsMap[result.eventId] = result.event;
          }
        });
        setEvents(eventsMap);

        // 承認された応募の企業情報をローカルストレージに保存
        sorted
          .filter((app) => app.status === "approved")
          .forEach((app) => {
            const event = eventsMap[app.eventId];
            const eventName = event?.title || app.eventId;
            const companyAddress = event?.orgWalletAddress || "";
            const companyName = event?.orgWalletAddress
              ? `企業 (${event.orgWalletAddress.slice(
                  0,
                  6
                )}...${event.orgWalletAddress.slice(-4)})`
              : "不明な企業";

            if (companyAddress) {
              storage.addApprovedCompany({
                walletAddress: companyAddress,
                companyName: companyName,
                organization: companyName,
                eventId: app.eventId,
                eventTitle: eventName,
                approvedAt: app.appliedAt,
              });
            }
          });
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("応募一覧の読み込みに失敗しました");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (isConnected && account) {
      loadApplications();
    } else {
      setLoading(false);
    }
  }, [isConnected, account, loadApplications]);

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

  /**
   * イベントIDからイベント名を取得
   */
  const getEventName = (eventId) => {
    const event = events[eventId];
    return event?.title || eventId;
  };

  /**
   * 応募テキストからZKP証明データを抽出
   */
  const extractZKPProof = (applicationText) => {
    try {
      // 【ZKP証明データ】セクションを探す
      const zkpSection = applicationText.match(/【ZKP証明データ】\s*\n(.*)/s);
      if (zkpSection) {
        const proofData = JSON.parse(zkpSection[1]);
        if (proofData.type === "ZKP_PROOF") {
          return proofData;
        }
      }
    } catch {
      // JSON解析エラーは無視
    }
    return null;
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-600 font-semibold text-lg">
            ウォレットを接続してください
          </p>
          <p className="text-yellow-500 mt-2">
            応募一覧を確認するには、MetaMask
            などのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={loadApplications}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // ステータス別に応募を分類
  const pendingApps = applications.filter((app) => app.status === "pending");
  const approvedApps = applications.filter((app) => app.status === "approved");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">応募一覧</h1>
        <p className="text-gray-600">あなたが送った応募の状況を確認できます</p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {applications.length}
          </div>
          <div className="text-sm text-gray-600">総応募数</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="text-3xl font-bold text-yellow-600 mb-1">
            {pendingApps.length}
          </div>
          <div className="text-sm text-gray-600">審査中</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {approvedApps.length}
          </div>
          <div className="text-sm text-gray-600">承認済み</div>
        </div>
      </div>

      {/* 応募一覧 */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg mb-2">まだ応募がありません</p>
          <p className="text-sm text-gray-400 mb-4">
            イベントに応募すると、ここに表示されます
          </p>
          <Link
            to="/student/events"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            イベント一覧を見る
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.applicationId}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🎫</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {getEventName(application.eventId)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        応募日時:{" "}
                        {application.appliedAt
                          ? new Date(application.appliedAt).toLocaleString(
                              "ja-JP"
                            )
                          : "不明"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusStyle(
                      application.status || "pending"
                    )}`}
                  >
                    {getStatusLabel(application.status || "pending")}
                  </span>
                </div>
              </div>

              {application.applicationText && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    応募動機・メッセージ
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {application.applicationText
                      .replace(/【ZKP証明データ】\s*\n.*/s, "")
                      .trim()}
                  </p>

                  {/* ZKP証明データの検出と表示（公開情報のみ） */}
                  {(() => {
                    const zkpProof = extractZKPProof(
                      application.applicationText
                    );
                    if (!zkpProof) return null;

                    return (
                      <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-lg">🔐</span>
                          <span className="font-semibold text-indigo-900">
                            ZKP証明データ
                          </span>
                        </div>

                        {/* 選択された証明タイプを表示 */}
                        {zkpProof.proofs && zkpProof.proofs.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm font-semibold text-indigo-900 mb-2">
                              選択された証明:
                            </div>
                            <div className="space-y-2">
                              {zkpProof.proofs.map((proof, proofIdx) => {
                                const proofTypeLabel =
                                  proof.type === "age"
                                    ? "年齢証明"
                                    : proof.type === "toeic"
                                    ? "TOEIC証明"
                                    : proof.type === "degree"
                                    ? "学位証明"
                                    : proof.type;

                                return (
                                  <div
                                    key={proofIdx}
                                    className="bg-white rounded-lg border border-indigo-200 p-2 text-sm"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">
                                        {proof.proof?.skipped ? "⏭️" : "✅"}
                                      </span>
                                      <span className="font-semibold text-indigo-900">
                                        {proofTypeLabel}
                                      </span>
                                      {proof.proof?.skipped && (
                                        <span className="text-xs text-gray-500">
                                          (スキップ)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 公開情報（開示）のみ表示 */}
                        {zkpProof.publicInputs &&
                          Object.keys(zkpProof.publicInputs).length > 0 && (
                            <div>
                              <div className="text-sm font-semibold text-indigo-900 mb-2">
                                公開情報（開示）:
                              </div>
                              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                                <div className="space-y-1 text-sm">
                                  {Object.entries(zkpProof.publicInputs).map(
                                    ([key, value]) => (
                                      <div key={key} className="text-gray-900">
                                        <span className="font-semibold">
                                          {key}:
                                        </span>{" "}
                                        {String(value)}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 font-mono">
                  応募ID: {application.applicationId.slice(0, 8)}...
                </div>
                <Link
                  to={`/student/events/${application.eventId}/apply`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  イベント詳細を見る →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
