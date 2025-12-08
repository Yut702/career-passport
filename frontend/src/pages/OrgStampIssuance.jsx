import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storage } from "../lib/storage";

export default function OrgStampIssuance() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    organization: "野村證券",
    category: "finance",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newStamp = {
        name: formData.name,
        organization: formData.organization,
        category: formData.category,
        issuedAt: new Date().toISOString().split("T")[0],
      };

      storage.addStamp(newStamp);
      setIsSubmitting(false);
      alert("スタンプを発行しました！");
      navigate("/org");
    } catch (err) {
      console.error("Error issuing stamp:", err);
      alert(err.message || "スタンプの発行に失敗しました");
      setIsSubmitting(false);
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900">
                スタンプを発行
              </h1>
              <p className="text-gray-600 mt-1">新しいスタンプを作成します</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                スタンプ名
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
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
                <option value="野村證券">野村證券</option>
                <option value="電通">電通</option>
                <option value="三菱商事">三菱商事</option>
                <option value="トヨタ">トヨタ</option>
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

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
              >
                {isSubmitting ? "発行中..." : "🎫 スタンプを発行"}
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
