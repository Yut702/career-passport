import { useWallet } from "../hooks/useWallet";

/**
 * ウォレット接続コンポーネント
 * 
 * MetaMask などのウォレットと接続するためのUIコンポーネント。
 * useWallet フックを使用してウォレット接続状態を管理します。
 * 
 * 機能:
 * - ウォレット接続ボタンの表示
 * - 接続済みアカウントの表示
 * - ウォレット切断機能
 * - エラーメッセージの表示
 */
export default function WalletConnect() {
  // useWallet フックから状態と関数を取得
  const { account, isConnecting, error, connectWallet, disconnectWallet } =
    useWallet();

  /**
   * ウォレットアドレスを短縮形式で表示する関数
   * 
   * 例: "0x1234567890abcdef..." → "0x1234...cdef"
   * 
   * @param {string} address - ウォレットアドレス
   * @returns {string} 短縮されたアドレス
   */
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isConnecting ? "接続中..." : "ウォレット接続"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

