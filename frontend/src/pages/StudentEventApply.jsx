import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWalletConnect } from "../hooks/useWalletConnect";
import { eventAPI } from "../lib/api";
import { formatOrganization } from "../lib/utils";
import { storage } from "../lib/storage";

export default function StudentEventApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, isConnected } = useWalletConnect();
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    motivation: "",
    experience: "",
  });
  const [availableProofs, setAvailableProofs] = useState([]);
  const [selectedProofId, setSelectedProofId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const hasApplied = myApplications.length > 0; // 応募済みかどうか

  useEffect(() => {
    // APIからイベント詳細を取得
    const loadEvent = async () => {
      setLoading(true);
      try {
        const response = await eventAPI.getById(id);
        if (response.ok && response.event) {
          setEvent({
            eventId: response.event.eventId,
            title: response.event.title,
            organization: response.event.orgWalletAddress || "企業",
            description: response.event.description || "",
            startDate: response.event.startDate,
            endDate: response.event.endDate,
            location: response.event.location || "",
            maxParticipants: response.event.maxParticipants,
            status: response.event.status,
          });
        } else {
          setEvent(null);
        }
      } catch (err) {
        console.error("Error loading event:", err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  // 自分の応募履歴を取得
  useEffect(() => {
    if (!isConnected || !account) return;

    const loadMyApplications = async () => {
      try {
        const response = await eventAPI.getMyApplications(account);
        if (response && response.ok && response.applications) {
          const eventApplications = response.applications.filter(
            (app) => app.eventId === id
          );
          setMyApplications(eventApplications);
        } else {
          // エラーが発生した場合は空配列を設定（エラーを無視して続行）
          setMyApplications([]);
        }
      } catch (err) {
        console.error("Error loading applications:", err);
        // エラーが発生した場合は空配列を設定（エラーを無視して続行）
        setMyApplications([]);
      }
    };

    loadMyApplications();
  }, [isConnected, account, id]);

  // 利用可能なZKP証明を読み込む
  useEffect(() => {
    const proofs = storage.getZKPProofs();
    // 検証済みの証明のみを表示
    const verifiedProofs = proofs.filter(
      (p) => p.verifyResult?.verified === true
    );
    setAvailableProofs(verifiedProofs);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // ウォレット接続チェック
    if (!isConnected || !account) {
      setError("ウォレットが接続されていません");
      return;
    }

    setSubmitting(true);

    try {
      // 選択されたZKP証明を取得
      let zkpProofData = null;
      if (selectedProofId) {
        zkpProofData = storage.getZKPProofById(selectedProofId);
      }

      // APIに応募情報を送信（ZKP証明データを含む）
      let applicationText = `${formData.motivation}\n\n【経験・スキル】\n${formData.experience}`;

      // ZKP証明が選択されている場合は、JSON形式で添付
      if (zkpProofData) {
        const proofAttachment = JSON.stringify({
          type: "ZKP_PROOF",
          ...zkpProofData,
        });
        applicationText += `\n\n【ZKP証明データ】\n${proofAttachment}`;
      }

      console.log("📤 応募送信:", {
        eventId: id,
        walletAddress: account,
        hasZKPProof: !!zkpProofData,
      });

      const response = await eventAPI.apply(id, account, applicationText);

      console.log("✅ 応募成功:", response);

      if (response.ok && response.application) {
        setApplicationId(response.application.applicationId);
        setSuccess(true);

        // 応募履歴を再取得
        const appsResponse = await eventAPI.getMyApplications(account);
        if (appsResponse.ok && appsResponse.applications) {
          const eventApplications = appsResponse.applications.filter(
            (app) => app.eventId === id
          );
          setMyApplications(eventApplications);
        }
      } else {
        throw new Error(response.error || "応募に失敗しました");
      }
    } catch (err) {
      console.error("❌ 応募エラー:", err);
      setError(err.message || "応募に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">イベントが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/student/events")}
        className="mb-6 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
      >
        <span>←</span>
        <span>イベント一覧に戻る</span>
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {event.title}
          </h1>
          <p className="text-gray-600 mb-4">
            {formatOrganization(event.organization)}
          </p>
          <p className="text-gray-700">{event.description || "説明なし"}</p>
        </div>

        <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-bold text-gray-900 mb-3">開催期間</h3>
          <p className="text-gray-700">
            {event.startDate} ～ {event.endDate}
          </p>
        </div>

        {event.location && (
          <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">開催場所</h3>
            <p className="text-gray-700">{event.location}</p>
          </div>
        )}
        {event.maxParticipants && (
          <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">最大参加者数</h3>
            <p className="text-gray-700">{event.maxParticipants}人</p>
          </div>
        )}

        {!isConnected && (
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <p className="text-yellow-800 font-semibold">
              ⚠️ ウォレットを接続してください
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              応募するには、MetaMaskなどのウォレットを接続する必要があります。
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-800 font-semibold">エラー</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <p className="text-green-800 font-semibold text-lg mb-2">
              ✅ 応募が完了しました！
            </p>
            {applicationId && (
              <div className="bg-white rounded-lg p-3 mt-2 mb-2">
                <p className="text-green-700 text-sm">
                  <strong>応募ID:</strong>{" "}
                  <code className="font-mono text-xs">{applicationId}</code>
                </p>
                <p className="text-green-700 text-xs mt-1">
                  このIDで応募状況を確認できます
                </p>
              </div>
            )}
            <p className="text-green-700 text-sm mt-1">
              応募履歴は下記に表示されます。
            </p>
          </div>
        )}

        {/* 応募履歴表示 */}
        {myApplications.length > 0 && (
          <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">
              📋 このイベントへの応募履歴
            </h3>
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div
                  key={app.applicationId}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-gray-600">
                      ID: {app.applicationId.slice(0, 8)}...
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : app.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {app.status === "approved"
                        ? "承認済み"
                        : app.status === "rejected"
                        ? "却下"
                        : "審査中"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    応募日時: {new Date(app.appliedAt).toLocaleString("ja-JP")}
                  </p>
                  {app.applicationText && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                        応募内容を表示
                      </summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 whitespace-pre-wrap">
                        {app.applicationText}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasApplied ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                応募動機 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="このイベントに応募する理由を記入してください"
                required
                disabled={submitting || !isConnected}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                経験・スキル
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="関連する経験やスキルを記入してください"
                disabled={submitting || !isConnected}
              />
            </div>

            {/* ZKP証明選択 */}
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔐 ZKP証明を添付（オプション）
              </label>
              <p className="text-xs text-gray-600 mb-3">
                個人情報を開示せずに条件を満たすことを証明できます。VC管理ページで証明を生成・検証してください。
              </p>
              {availableProofs.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️
                    利用可能なZKP証明がありません。VC管理ページで証明を生成・検証してください。
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/student/settings?tab=zkp")}
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 underline"
                  >
                    VC管理ページを開く
                  </button>
                </div>
              ) : (
                <select
                  value={selectedProofId || ""}
                  onChange={(e) => setSelectedProofId(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  disabled={submitting || !isConnected}
                >
                  <option value="">証明を選択しない</option>
                  {availableProofs.map((proof) => (
                    <option key={proof.id} value={proof.id}>
                      {proof.proofHash
                        ? `証明 ${proof.proofHash.slice(0, 16)}... (${
                            proof.usedVCs
                              ?.map((vc) => {
                                const names = {
                                  myNumber: "マイナンバー",
                                  toeic: "TOEIC",
                                  degree: "学位",
                                };
                                return names[vc.type] || vc.type;
                              })
                              .join(", ") || "不明"
                          })`
                        : `証明 ${proof.id}`}
                    </option>
                  ))}
                </select>
              )}
              {selectedProofId && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
                  <p className="text-xs text-gray-700">
                    ✅ 選択された証明が応募に添付されます
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/student/events")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || !isConnected || hasApplied}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? "送信中..." : "応募する"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
            <p className="text-blue-800 font-semibold text-center mb-2">
              ✅ このイベントには既に応募済みです
            </p>
            <p className="text-blue-700 text-sm text-center">
              応募状況は上記の応募履歴で確認できます
            </p>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => navigate("/student/events")}
                className="px-6 py-3 border border-blue-300 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors"
              >
                イベント一覧に戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
