import { Link, useLocation, useNavigate } from "react-router-dom";
import WalletConnect from "./WalletConnect";
import { useWalletConnect } from "../hooks/useWalletConnect";

export default function StudentLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { account, isConnecting, connectWallet, error } = useWalletConnect();

  const handleLogout = () => {
    // ローカルストレージをクリア（必要に応じて）
    // localStorage.clear();
    navigate("/");
  };

  // ウォレットが接続されていない場合、接続を促す画面を表示
  if (!account && !isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-5xl">👤</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ウォレット接続が必要です
          </h2>
          <p className="text-gray-600 mb-8">
            個人ログインを続けるには、MetaMaskウォレットを接続してください。
          </p>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? "接続中..." : "ウォレット接続"}
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  // 接続中の場合
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">ウォレット接続中...</p>
        </div>
      </div>
    );
  }

  // ウォレット接続済みの場合、通常のレイアウトを表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/student" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-2xl">🎫</span>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Non-Fungible Career
                  </div>
                  <div className="text-xs text-gray-500">ユーザー向け</div>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/student"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/student"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                ホーム
              </Link>
              <Link
                to="/student/mypage"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/student/mypage"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                マイページ
              </Link>
              <Link
                to="/student/events"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith("/student/events")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                イベント
              </Link>
              <Link
                to="/student/applications"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/student/applications"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                応募一覧
              </Link>
              <Link
                to="/student/job-conditions"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith("/student/job")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                求人
              </Link>
              <Link
                to="/student/messages"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/student/messages"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                メッセージ
              </Link>
              <Link
                to="/student/settings"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/student/settings"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                VC管理・ZKP
              </Link>
              <WalletConnect />
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
