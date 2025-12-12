import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { eventAPI } from "../lib/api";

export default function OrgEventCreate() {
  const navigate = useNavigate();
  const { account, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    maxParticipants: "",
    status: "upcoming",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // バリデーション
    if (!formData.title.trim()) {
      alert("イベントタイトルを入力してください");
      return;
    }
    if (!formData.startDate) {
      alert("開始日を選択してください");
      return;
    }
    if (!formData.endDate) {
      alert("終了日を選択してください");
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert("開始日は終了日より前である必要があります");
      return;
    }

    // ウォレット接続チェック
    if (!isConnected || !account) {
      alert(
        "ウォレットが接続されていません。ウォレットを接続してからイベントを作成してください。"
      );
      return;
    }

    setLoading(true);

    try {
      // ログイン中のウォレットアドレスを使用
      const orgWalletAddress = account;

      const response = await eventAPI.create({
        orgWalletAddress,
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location.trim(),
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : null,
        status: formData.status,
      });

      if (response.ok) {
        alert("イベントを作成しました！");
        navigate("/org/events");
      } else {
        throw new Error(response.error || "イベントの作成に失敗しました");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert(
        error.message ||
          "イベントの作成に失敗しました。もう一度お試しください。"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            新規イベント作成
          </h1>
          <p className="text-gray-600">
            NFT獲得イベントの情報を入力してください
          </p>
        </div>

        {!isConnected && (
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <p className="text-yellow-800 font-semibold">
              ⚠️ ウォレットを接続してください
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              イベントを作成するには、MetaMaskなどのウォレットを接続する必要があります。
            </p>
          </div>
        )}

        {isConnected && account && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-blue-800 font-semibold text-sm mb-1">
              📝 作成者情報
            </p>
            <p className="text-blue-700 text-sm">
              ウォレットアドレス: <span className="font-mono">{account}</span>
            </p>
            <p className="text-blue-600 text-xs mt-1">
              このイベントは上記のウォレットアドレスで作成されます
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              イベントタイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="例: サマーインターンシップ 2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              イベント説明
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="イベントの詳細説明を記入してください"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              開催場所
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="例: 東京都、リモート可"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大参加者数
            </label>
            <input
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="例: 50（空欄の場合は制限なし）"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            >
              <option value="upcoming">開催予定</option>
              <option value="active">開催中</option>
              <option value="completed">終了</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/org/events")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !isConnected}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "作成中..." : "イベントを作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
