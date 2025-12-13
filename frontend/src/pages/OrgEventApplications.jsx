import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { eventAPI } from "../lib/api";
import { storage } from "../lib/storage";
import { verifyProofs } from "../lib/zkp/verifier.js";

/**
 * イベント応募一覧ページ（企業向け）
 *
 * 特定のイベントに対する応募一覧を表示し、応募の詳細を確認・承認/拒否できるページです。
 */
export default function OrgEventApplications() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null); // 更新中の応募ID
  const [verifyingProofs, setVerifyingProofs] = useState(new Set()); // 検証中の証明ID
  const [proofVerificationResults, setProofVerificationResults] = useState({}); // 証明検証結果

  /**
   * イベント情報と応募一覧を読み込む
   */
  const loadEventAndApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // イベント情報を取得
      const eventResponse = await eventAPI.getById(id);
      if (eventResponse.ok && eventResponse.event) {
        setEvent(eventResponse.event);
      } else {
        setError("イベントが見つかりません");
        setLoading(false);
        return;
      }

      // 応募一覧を取得
      const response = await eventAPI.getEventApplications(id);

      if (response.ok && response.applications) {
        setApplications(response.applications);

        // 応募が来た場合、応募者情報をローカルストレージに保存
        response.applications.forEach((app) => {
          storage.addApplicant({
            walletAddress: app.walletAddress,
            eventId: id,
            eventTitle: eventResponse.event.title,
            applicationId: app.applicationId,
            appliedAt: app.appliedAt,
            status: app.status || "pending",
          });
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
  }, [id]);

  useEffect(() => {
    loadEventAndApplications();
  }, [loadEventAndApplications]);

  /**
   * 応募ステータスを更新
   */
  const handleUpdateStatus = async (applicationId, newStatus) => {
    setUpdatingStatus(applicationId);

    try {
      await eventAPI.updateApplicationStatus(applicationId, newStatus);

      // 応募一覧を更新
      const updatedApplications = applications.map((app) =>
        app.applicationId === applicationId
          ? { ...app, status: newStatus }
          : app
      );
      setApplications(updatedApplications);

      // 応募が来た場合、応募者情報をローカルストレージに保存
      const application = applications.find(
        (app) => app.applicationId === applicationId
      );
      if (application) {
        storage.addApplicant({
          walletAddress: application.walletAddress,
          eventId: `event-${id}`,
          eventTitle: event?.title || "",
          applicationId: application.applicationId,
          appliedAt: application.appliedAt,
          status: newStatus,
        });
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("ステータスの更新に失敗しました");
    } finally {
      setUpdatingStatus(null);
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
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
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

  /**
   * ZKP証明を検証
   */
  const handleVerifyZKPProof = async (applicationId, proofData) => {
    if (verifyingProofs.has(applicationId)) return;

    setVerifyingProofs((prev) => new Set(prev).add(applicationId));

    try {
      const proofResultForVerification = {
        proofs: proofData.proofs
          .filter(
            (p) => !p.proof?.skipped && p.proof && p.publicSignals?.length > 0
          )
          .map((p) => ({
            type: p.type,
            proof: {
              proof: p.proof,
              publicSignals: p.publicSignals,
            },
          })),
      };

      if (proofResultForVerification.proofs.length > 0) {
        const result = await verifyProofs(proofResultForVerification);
        setProofVerificationResults((prev) => ({
          ...prev,
          [applicationId]: result,
        }));
      } else {
        // スキップされた証明のみの場合
        setProofVerificationResults((prev) => ({
          ...prev,
          [applicationId]: {
            allVerified: true,
            results: proofData.proofs.map((p) => ({
              type: p.type,
              verified: true,
              skipped: true,
            })),
          },
        }));
      }
    } catch (error) {
      console.error("Error verifying ZKP proof:", error);
      setProofVerificationResults((prev) => ({
        ...prev,
        [applicationId]: {
          allVerified: false,
          results: [],
          error: error.message,
        },
      }));
    } finally {
      setVerifyingProofs((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

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
            onClick={loadEventAndApplications}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        to="/org/events"
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors"
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
        <span>イベント一覧に戻る</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {event?.title || "イベント応募一覧"}
            </h1>
            {event && (
              <p className="text-gray-600">
                開催期間: {event.startDate} ～ {event.endDate}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {applications.length}
            </div>
            <div className="text-sm text-gray-600">応募数</div>
          </div>
        </div>

        {event?.description && (
          <p className="text-gray-700 mb-4">{event.description}</p>
        )}
      </div>

      {/* 応募一覧 */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg mb-2">まだ応募がありません</p>
            <p className="text-sm text-gray-400">
              ユーザーからの応募が届くと、ここに表示されます
            </p>
          </div>
        ) : (
          applications.map((application) => (
            <div
              key={application.applicationId}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {application.walletAddress
                        ? application.walletAddress.slice(2, 4).toUpperCase()
                        : "??"}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {application.walletAddress
                          ? `${application.walletAddress.slice(
                              0,
                              6
                            )}...${application.walletAddress.slice(-4)}`
                          : "不明なアドレス"}
                      </div>
                      <div className="text-sm text-gray-500">
                        応募日:{" "}
                        {application.appliedAt
                          ? new Date(application.appliedAt).toLocaleDateString(
                              "ja-JP"
                            )
                          : "不明"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
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
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {application.applicationText
                      .replace(/【ZKP証明データ】\s*\n.*/s, "")
                      .trim()}
                  </p>

                  {/* ZKP証明データの検出と検証 */}
                  {(() => {
                    const zkpProof = extractZKPProof(
                      application.applicationText
                    );
                    if (!zkpProof) return null;

                    const verificationResult =
                      proofVerificationResults[application.applicationId];
                    const isVerifying = verifyingProofs.has(
                      application.applicationId
                    );

                    return (
                      <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🔐</span>
                            <span className="font-semibold text-indigo-900">
                              ZKP証明データ
                            </span>
                          </div>
                          {!verificationResult && !isVerifying && (
                            <button
                              onClick={() =>
                                handleVerifyZKPProof(
                                  application.applicationId,
                                  zkpProof
                                )
                              }
                              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                            >
                              検証する
                            </button>
                          )}
                        </div>

                        {isVerifying && (
                          <div className="text-sm text-indigo-700">
                            🔄 検証中...
                          </div>
                        )}

                        {verificationResult && (
                          <div className="mt-2 space-y-2">
                            <div
                              className={`p-2 rounded-lg ${
                                verificationResult.allVerified
                                  ? "bg-green-100 border border-green-300"
                                  : "bg-red-100 border border-red-300"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {verificationResult.allVerified ? "✅" : "❌"}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    verificationResult.allVerified
                                      ? "text-green-800"
                                      : "text-red-800"
                                  }`}
                                >
                                  {verificationResult.allVerified
                                    ? "検証成功"
                                    : "検証失敗"}
                                </span>
                              </div>
                              {verificationResult.results &&
                                verificationResult.results.length > 0 && (
                                  <div className="mt-2 text-xs space-y-1">
                                    {verificationResult.results.map(
                                      (result, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center space-x-2"
                                        >
                                          <span>
                                            {result.verified ? "✅" : "❌"}
                                          </span>
                                          <span>
                                            {result.type === "age"
                                              ? "年齢証明"
                                              : result.type === "toeic"
                                              ? "TOEIC証明"
                                              : result.type === "degree"
                                              ? "学位証明"
                                              : result.type}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex space-x-3">
                {application.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          application.applicationId,
                          "approved"
                        )
                      }
                      disabled={updatingStatus === application.applicationId}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
                    >
                      {updatingStatus === application.applicationId
                        ? "処理中..."
                        : "✅ 承認"}
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          application.applicationId,
                          "rejected"
                        )
                      }
                      disabled={updatingStatus === application.applicationId}
                      className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
                    >
                      {updatingStatus === application.applicationId
                        ? "処理中..."
                        : "❌ 拒否"}
                    </button>
                  </>
                )}
                {application.status === "approved" && (
                  <div className="flex-1 bg-green-50 border-2 border-green-200 text-green-700 py-3 rounded-xl font-bold text-center">
                    ✅ 承認済み
                  </div>
                )}
                {application.status === "rejected" && (
                  <div className="flex-1 bg-red-50 border-2 border-red-200 text-red-700 py-3 rounded-xl font-bold text-center">
                    ❌ 拒否済み
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
