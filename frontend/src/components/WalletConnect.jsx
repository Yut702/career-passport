import { useWalletConnect } from "../hooks/useWalletConnect";
import { formatAddress } from "../lib/utils";

/**
 * ウォレット接続コンポーネント
 *
 * MetaMaskと連携してウォレット接続を行うためのUIコンポーネント。
 * useWalletConnect フックを使用してウォレット接続状態を管理します。
 *
 * 機能:
 * - ウォレット接続ボタンの表示
 * - 接続済みアカウントの表示
 * - ウォレット切断機能
 * - エラーメッセージの表示
 */
export default function WalletConnect() {
  // useWalletConnect フックから状態と関数を取得
  const { account, isConnecting, error, connectWallet, disconnectWallet } =
    useWalletConnect();

  // ウォレットが接続されている場合の表示
  if (account) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">{formatAddress(account)}</span>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <button
          onClick={disconnectWallet}
          className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          切断
        </button>
      </div>
    );
  }

  // ウォレットが接続されていない場合の表示
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
      >
        {isConnecting ? "接続中..." : "ウォレット接続"}
      </button>
      {error && (
        <div className="relative group">
          <span className="text-red-500 text-lg cursor-help">⚠️</span>
          <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-red-50 border border-red-200 rounded-lg shadow-lg text-xs text-red-800 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-normal">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
