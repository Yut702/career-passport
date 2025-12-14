import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

/**
 * MetaMaskウォレット接続を管理するカスタムフック
 *
 * MetaMaskと連携してウォレット接続を管理します。
 *
 * @returns {Object} ウォレット接続状態と操作関数
 */
export function useWalletConnect() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);

  /**
   * インジェクトされたウォレットの接続を確認
   * MetaMaskで選択されているアカウントを取得
   */
  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum === "undefined") return;

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      // MetaMaskで現在選択されているアカウントを取得
      // eth_accountsを使用して、現在接続されているアカウントを取得
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        // 現在選択されているアカウント（最初のアカウント）のサインアーを取得
        const signer = await browserProvider.getSigner();
        const address = await signer.getAddress();
        const network = await browserProvider.getNetwork();

        setProvider(browserProvider);
        setSigner(signer);
        setAccount(address);
        setChainId(Number(network.chainId));
      } else {
        // アカウントが接続されていない場合は状態をリセット
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setChainId(null);
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  }, []);

  /**
   * 既存の接続を確認
   */
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      checkConnection();
    }
  }, [checkConnection]);

  /**
   * ウォレットを接続する関数
   */
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // MetaMaskがインストールされているか確認
      if (typeof window.ethereum === "undefined") {
        throw new Error(
          "MetaMaskがインストールされていません。MetaMaskをインストールしてから再度お試しください。"
        );
      }

      // MetaMaskと連携して接続
      // eth_requestAccountsを呼び出すと、MetaMaskでユーザーが選択したアカウントが返される
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);

      // 現在選択されているアカウントのサインアーを取得
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(signer);
      setAccount(address);
      setChainId(Number(network.chainId));
      setIsConnecting(false);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      let errorMessage = "ウォレット接続に失敗しました";
      if (err.code === 4001 || err.message?.includes("rejected")) {
        errorMessage = "接続が拒否されました";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setIsConnecting(false);
    }
  }, []);

  /**
   * ウォレットを切断する関数
   */
  const disconnectWallet = useCallback(async () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  }, []);

  /**
   * ネットワーク変更とアカウント変更のイベントを監視
   */
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleChainChanged = async (chainId) => {
        const newChainId = Number(chainId);
        setChainId(newChainId);
        await checkConnection();
      };

      const handleAccountsChanged = async (accounts) => {
        console.log("handleAccountsChanged: アカウント変更を検知", {
          accounts,
        });
        if (accounts.length === 0) {
          // アカウントが切断された場合
          console.log("handleAccountsChanged: アカウントが切断されました");
          await disconnectWallet();
        } else {
          // MetaMaskでアカウントが切り替えられた場合、新しいアカウントを反映
          // accounts[0]がMetaMaskで現在選択されているアカウント
          try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const signer = await browserProvider.getSigner();
            const address = await signer.getAddress();
            const network = await browserProvider.getNetwork();

            console.log("handleAccountsChanged: 新しいアカウントを設定", {
              address,
            });
            setProvider(browserProvider);
            setSigner(signer);
            setAccount(address);
            setChainId(Number(network.chainId));
          } catch (err) {
            console.error("Error handling accounts changed:", err);
            await checkConnection();
          }
        }
      };

      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, [checkConnection, disconnectWallet]);

  return {
    account,
    provider,
    signer,
    isConnecting,
    chainId,
    error,
    connectWallet,
    disconnectWallet,
    isConnected: !!account,
  };
}
