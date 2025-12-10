import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";

/**
 * スタンプ発行ページ（企業向け）
 *
 * ブロックチェーン経由でスタンプを発行する機能を提供します。
 * ウォレット接続が必要で、StampManager コントラクトを使用してスタンプを発行します。
 */
export default function OrgStampIssuance() {
  const navigate = useNavigate();
  const { stampManagerContract, isReady } = useContracts();
  const { isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    userAddress: "",
    stampName: "",
    organization: "企業A",
    category: "finance",
  });

  /**
   * フォーム送信ハンドラー
   *
   * ブロックチェーン経由でスタンプを発行します。
   * トランザクションの確認を待ち、成功したらフォームをリセットします。
   *
   * @param {Event} e - フォーム送信イベント
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // ウォレット接続チェック
    if (!isConnected) {
      setError("ウォレットが接続されていません");
      return;
    }

    // コントラクト読み込みチェック
    if (!isReady || !stampManagerContract) {
      setError("コントラクトが読み込まれていません");
      return;
    }

    setIsLoading(true);

    try {
      // トランザクションを送信
      // issueStamp(address user, string memory name, string memory organization, string memory category)
      const tx = await stampManagerContract.issueStamp(
        formData.userAddress,
        formData.stampName,
        formData.organization,
        formData.category
      );

      // トランザクションの確認を待つ（ブロックに含まれるまで待機）
      await tx.wait();

      // 成功メッセージを表示
      setSuccess(true);
      // フォームをリセット
      setFormData({
        userAddress: "",
        stampName: "",
        organization: "企業A",
        category: "finance",
      });

      // 3秒後にダッシュボードに戻る
      setTimeout(() => {
        navigate("/org");
      }, 3000);
    } catch (error) {
      console.error("Error issuing stamp:", error);

      // エラーメッセージを設定
      let errorMessage = "スタンプ発行に失敗しました";
      if (error.reason) {
        // コントラクトから返されたエラーメッセージ
        errorMessage = error.reason;
      } else if (error.message) {
        // その他のエラーメッセージ
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ウォレットが接続されていない場合の表示
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold text-lg">
            ウォレットを接続してください
          </p>
          <p className="text-red-500 mt-2">
            スタンプを発行するには、MetaMask
            などのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/org"
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
        <span>ダッシュボードに戻る</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🎫</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">スタンプを発行</h1>
            <p className="text-gray-600 mt-1">
              ブロックチェーン経由で新しいスタンプを作成します
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              ユーザーアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.userAddress}
              onChange={(e) =>
                setFormData({ ...formData, userAddress: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
              placeholder="0x..."
            />
            <p className="text-xs text-gray-500 mt-1">
              スタンプを受け取るユーザーのウォレットアドレスを入力してください
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              スタンプ名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.stampName}
              onChange={(e) =>
                setFormData({ ...formData, stampName: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="例: 投資分析セミナー"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              企業名
            </label>
            <select
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            >
              <option value="企業A">企業A</option>
              <option value="企業B">企業B</option>
              <option value="企業C">企業C</option>
              <option value="企業D">企業D</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              カテゴリ
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            >
              <option value="finance">金融 💰</option>
              <option value="marketing">マーケティング 📊</option>
              <option value="business">ビジネス 💼</option>
              <option value="programming">プログラミング 💻</option>
              <option value="design">デザイン 🎨</option>
            </select>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl">
              <p className="font-semibold">エラー</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl">
              <p className="font-semibold">
                ✅ スタンプが正常に発行されました！
              </p>
              <p className="text-sm mt-1">3秒後にダッシュボードに戻ります...</p>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isLoading || !isReady}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
            >
              {isLoading ? "⏳ 発行中..." : "🎫 スタンプを発行"}
            </button>
            <Link
              to="/org"
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition text-center border-2 border-gray-200"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
