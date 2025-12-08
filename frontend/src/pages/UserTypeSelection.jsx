import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserTypeSelection() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);

  const handleSelect = (type) => {
    setSelectedType(type);
    if (type === "student") {
      navigate("/student");
    } else if (type === "org") {
      navigate("/org");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🎫</span>
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Non-Fungible Career
              </h1>
              <p className="text-gray-600 text-lg">キャリアパスポート</p>
            </div>
          </div>
          <p className="text-gray-700 text-xl">ログインタイプを選択してください</p>
        </div>

        {/* 選択カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ユーザー用 */}
          <div
            onClick={() => handleSelect("student")}
            className={`group relative bg-white rounded-3xl shadow-xl p-10 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 ${
              selectedType === "student"
                ? "border-blue-500"
                : "border-transparent hover:border-blue-300"
            }`}
          >
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-5xl">👤</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">ユーザー</h2>
              <p className="text-gray-600 mb-6">
                スタンプを集めて、NFT証明書を取得しましょう
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>スタンプコレクション</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>NFT証明書の取得</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>進捗の確認</span>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                ユーザーとしてログイン
              </button>
            </div>
          </div>

          {/* 企業用 */}
          <div
            onClick={() => handleSelect("org")}
            className={`group relative bg-white rounded-3xl shadow-xl p-10 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 ${
              selectedType === "org"
                ? "border-purple-500"
                : "border-transparent hover:border-purple-300"
            }`}
          >
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-5xl">🏢</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">企業</h2>
              <p className="text-gray-600 mb-6">
                スタンプを発行して、ユーザーの成長をサポート
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>スタンプの発行</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>統計情報の確認</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>ユーザー管理</span>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                企業としてログイン
              </button>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>東京大学 ブロックチェーンイノベーション寄附講座</p>
        </div>
      </div>
    </div>
  );
}

