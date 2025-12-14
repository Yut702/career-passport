import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWalletConnect } from "../hooks/useWalletConnect";
import { useContracts } from "../hooks/useContracts";
import { nftApplicationAPI } from "../lib/api";

/**
 * NFT申請一覧ページ（企業向け）
 *
 * ユーザーからのNFT証明書発行申請を確認し、承認・発行する機能を提供します。
 */
export default function OrgNFTApplications() {
  const navigate = useNavigate();
  const { account, isConnected } = useWalletConnect();
  const { stampManagerContract, isReady } = useContracts();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null); // 処理中の申請ID

  /**
   * 申請一覧を読み込む
   */
  const loadApplications = useCallback(async () => {
    if (!account || !isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apps = await nftApplicationAPI.getByOrg(account);
      console.log("Loaded NFT applications:", apps);
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (err) {
      console.error("Error loading NFT applications:", err);
      setError(`申請一覧の読み込みに失敗しました: ${err.message || err}`);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [account, isConnected]);

  /**
   * 初回とaccount変更時に申請一覧を読み込む
   */
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  /**
   * 申請を承認してNFT発行画面に遷移
   */
  const handleApprove = async (application) => {
    if (!stampManagerContract || !account || !isReady) {
      setError("コントラクトが準備できていません");
      return;
    }

    setProcessing(application.applicationId);
    setError(null);

    try {
      // スタンプ数を再確認
      const count = await stampManagerContract.getOrganizationStampCount(
        application.userWalletAddress,
        application.organization
      );
      const canMint = await stampManagerContract.canMintNft(
        application.userWalletAddress,
        application.organization
      );

      if (!canMint || Number(count) < 3) {
        setError(
          `スタンプ数が不足しています（現在: ${Number(
            count
          )}枚、必要: 3枚以上）`
        );
        setProcessing(null);
        return;
      }

      // 申請ステータスを「approved」に更新
      await nftApplicationAPI.updateStatus(
        application.applicationId,
        "approved"
      );

      // NFT発行画面に遷移（申請情報を渡す）
      navigate("/org/nft-issuance", {
        state: {
          application: {
            applicationId: application.applicationId,
            userAddress: application.userWalletAddress,
            organization: application.organization,
            stampCount: application.stampCount,
          },
        },
      });
    } catch (err) {
      console.error("Error approving application:", err);
      let errorMessage = "申請の承認に失敗しました";
      if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setProcessing(null);
    }
  };

  /**
   * 申請を却下
   */
  const handleReject = async (applicationId) => {
    if (!window.confirm("この申請を却下しますか？")) {
      return;
    }

    setProcessing(applicationId);
    setError(null);

    try {
      await nftApplicationAPI.updateStatus(applicationId, "rejected");
      await loadApplications();
      alert("申請を却下しました");
    } catch (err) {
      console.error("Error rejecting application:", err);
      setError("申請の却下に失敗しました");
    } finally {
      setProcessing(null);
    }
  };

  /**
   * 発行済みの申請をリセット（pendingに戻す）
   */
  const handleResetStatus = async (applicationId) => {
    if (
      !window.confirm(
        "発行済みの申請をリセットしますか？\nステータスが「申請中」に戻り、再発行が可能になります。"
      )
    ) {
      return;
    }

    setProcessing(applicationId);
    setError(null);

    try {
      await nftApplicationAPI.updateStatus(applicationId, "pending");
      await loadApplications();
      alert("申請ステータスをリセットしました。再発行が可能です。");
    } catch (err) {
      console.error("Error resetting application status:", err);
      setError("申請ステータスのリセットに失敗しました");
    } finally {
      setProcessing(null);
    }
  };

  /**
   * ステータスに応じたバッジの色を取得
   */
  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-blue-100 text-blue-800 border-blue-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
      issued: "bg-green-100 text-green-800 border-green-300",
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  /**
   * ステータスに応じた日本語ラベルを取得
   */
  const getStatusLabel = (status) => {
    const labels = {
      pending: "申請中",
      approved: "承認済み",
      rejected: "却下",
      issued: "発行済み",
    };
    return labels[status] || status;
  };

  if (!isConnected || !account) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">ウォレットを接続してください</div>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          NFT証明書発行申請
        </h1>
        <p className="text-gray-600">
          ユーザーからのNFT証明書発行申請を確認し、承認・発行できます
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">申請はまだありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.applicationId}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {app.organization}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {getStatusLabel(app.status)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">申請者:</span>{" "}
                      {app.userWalletAddress.slice(0, 6)}...
                      {app.userWalletAddress.slice(-4)}
                    </div>
                    <div>
                      <span className="font-semibold">スタンプ数:</span>{" "}
                      {app.stampCount}枚
                    </div>
                    <div>
                      <span className="font-semibold">申請日:</span>{" "}
                      {new Date(app.createdAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                {app.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(app)}
                      disabled={processing === app.applicationId || !isReady}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === app.applicationId
                        ? "⏳ 処理中..."
                        : "✅ 承認して発行"}
                    </button>
                    <button
                      onClick={() => handleReject(app.applicationId)}
                      disabled={processing === app.applicationId}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      却下
                    </button>
                  </>
                )}
                {app.status === "approved" && (
                  <button
                    onClick={() => handleApprove(app)}
                    disabled={processing === app.applicationId || !isReady}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === app.applicationId
                      ? "⏳ 処理中..."
                      : "🏆 NFT発行画面へ"}
                  </button>
                )}
                {app.status === "issued" && (
                  <>
                    <div className="flex-1 bg-green-50 border-2 border-green-300 text-green-700 px-6 py-3 rounded-xl font-bold text-center">
                      ✅ NFT証明書を発行済み
                    </div>
                    <button
                      onClick={() => handleResetStatus(app.applicationId)}
                      disabled={processing === app.applicationId}
                      className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="ステータスをリセットして再発行可能にする"
                    >
                      🔄 リセット
                    </button>
                  </>
                )}
                {app.status === "rejected" && (
                  <div className="flex-1 bg-red-50 border-2 border-red-300 text-red-700 px-6 py-3 rounded-xl font-bold text-center">
                    ❌ 却下済み
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
