import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WalletConnect from "../components/WalletConnect";
import { useWallet } from "../hooks/useWallet";

/**
 * ウォレット接続専用ページ
 * 
 * シンプルなウォレット接続ボタンのみを表示。
 * 接続成功後、UserTypeSelection画面へ遷移します。
 */
export default function WalletConnectPage() {
  const navigate = useNavigate();
  const { account, isConnecting } = useWallet();

  /**
   * ウォレット接続成功時にUserTypeSelection画面へ遷移
   */
  useEffect(() => {
    if (account) {
      // 接続成功後、少し待ってから遷移（UX向上）
      const timer = setTimeout(() => {
        navigate("/user-select");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [account, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center">
                <span className="text-4xl">🔐</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              ウォレット接続
            </h1>
            <p className="text-gray-600">
              MetaMaskを使ってログイン
            </p>
          </div>

          {/* ウォレット接続コンポーネント */}
          <div className="flex flex-col items-center space-y-4">
            <WalletConnect />
            
            {isConnecting && (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">接続中...</span>
              </div>
            )}

            {account && (
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">接続成功！</span>
              </div>
            )}
          </div>

          {/* 説明 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p>MetaMaskがインストールされている必要があります</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p>Anvil Local ネットワークに自動接続します</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p>接続後、ユーザータイプを選択してください</p>
              </div>
            </div>
          </div>

          {/* 戻るボタン */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← トップページに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
