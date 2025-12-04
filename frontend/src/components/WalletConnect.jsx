import { useState, useEffect } from "react";

export default function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // 既存の接続を確認
    if (typeof window.ethereum !== "undefined") {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        });
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask がインストールされていません。\nMetaMask をインストールしてから再度お試しください。");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      
      if (accounts.length === 0) {
        throw new Error("アカウントが選択されませんでした");
      }
      
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      
      let errorMessage = "ウォレット接続に失敗しました";
      if (error.code === 4001) {
        errorMessage = "接続が拒否されました";
      } else if (error.code === -32002) {
        errorMessage = "既に接続リクエストが処理中です";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (account) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          {formatAddress(account)}
        </span>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      {isConnecting ? "接続中..." : "ウォレット接続"}
    </button>
  );
}

