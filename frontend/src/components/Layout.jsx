import { Link, useLocation } from "react-router-dom";
import WalletConnect from "./WalletConnect";

export default function Layout({ children }) {
  const location = useLocation();
  const isOrgPage = location.pathname.startsWith("/org");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-2xl">🎫</span>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Non-Fungible Career
                  </div>
                  <div className="text-xs text-gray-500">キャリアパスポート</div>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              {!isOrgPage ? (
                <>
                  <Link
                    to="/"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === "/"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    ホーム
                  </Link>
                  <Link
                    to="/mypage"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === "/mypage"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    マイページ
                  </Link>
                  <Link
                    to="/nfts"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === "/nfts"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    NFT 証明書
                  </Link>
                </>
              ) : (
                <Link
                  to="/org"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/org"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  ダッシュボード
                </Link>
              )}
              <WalletConnect />
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

