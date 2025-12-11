import { useNavigate } from "react-router-dom";

/**
 * トップページ（ランディングページ）
 * 
 * アプリケーションの入り口。
 * サービスの概要を表示し、ウォレット接続画面への導線を提供します。
 */
export default function TopPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Non-Fungible Career
            </h1>
            <p className="text-xl text-gray-600">
              ブロックチェーンで証明する、あなたのキャリア
            </p>
          </div>

          {/* 説明セクション */}
          <div className="space-y-6 mb-12">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎫</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  スタンプを集める
                </h3>
                <p className="text-gray-600">
                  企業やイベントからスタンプを獲得してキャリアを証明
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  NFT証明書を取得
                </h3>
                <p className="text-gray-600">
                  一定数のスタンプでNFT証明書を発行し、キャリアを可視化
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔐</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Web3で安全に管理
                </h3>
                <p className="text-gray-600">
                  ブロックチェーン技術により改ざん不可能な証明を実現
                </p>
              </div>
            </div>
          </div>

          {/* CTAボタン */}
          <div className="text-center">
            <button
              onClick={() => navigate("/connect")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              はじめる
            </button>
            <p className="mt-4 text-sm text-gray-500">
              ウォレット接続でログイン
            </p>
            
            {/* 開発用：直接ユーザー選択画面へ */}
            <div className="mt-6">
              <button
                onClick={() => navigate("/user-select")}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                ユーザー選択へ（開発用・MetaMask不要）
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
