import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { switchToAnvilNetwork, isCorrectNetwork } from "../lib/network";

/**
 * ウォレット接続を管理するカスタムフック
 *
 * MetaMask などのウォレットと接続し、アカウント情報、プロバイダー、サインアーを管理します。
 * ネットワーク変更やアカウント変更のイベントも監視します。
 *
 * @returns {Object} ウォレット接続状態と操作関数
 * @returns {string|null} account - 接続中のウォレットアドレス
 * @returns {ethers.BrowserProvider|null} provider - Ethers.js プロバイダー
 * @returns {ethers.JsonRpcSigner|null} signer - トランザクション署名用のサインアー
 * @returns {boolean} isConnecting - 接続処理中の状態
 * @returns {number|null} chainId - 現在のチェーンID
 * @returns {string|null} error - エラーメッセージ
 * @returns {Function} connectWallet - ウォレット接続関数
 * @returns {Function} disconnectWallet - ウォレット切断関数
 * @returns {boolean} isConnected - 接続状態の真偽値
 */
export function useWallet() {
  // ウォレットアドレス（接続中のアカウント）
  const [account, setAccount] = useState(null);
  // Ethers.js プロバイダー（ブロックチェーンとの通信を担当）
  const [provider, setProvider] = useState(null);
  // サインアー（トランザクションの署名を担当）
  const [signer, setSigner] = useState(null);
  // 接続処理中の状態
  const [isConnecting, setIsConnecting] = useState(false);
  // 現在のチェーンID（例: 31337 = Anvil Local）
  const [chainId, setChainId] = useState(null);
  // エラーメッセージ
  const [error, setError] = useState(null);

  /**
   * コンポーネントマウント時に既存の接続を確認
   *
   * ページをリロードした際や、既にMetaMaskに接続済みの場合に、
   * 自動的に接続状態を復元します。
   */
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      checkConnection();
    }
  }, []);

  /**
   * 既存のウォレット接続を確認する関数
   *
   * MetaMask が既に接続されている場合、アカウント情報を取得して
   * 状態を更新します。接続されていない場合は何も行いません。
   *
   * @async
   * @returns {Promise<void>}
   */
  const checkConnection = async () => {
    try {
      // Ethers.js の BrowserProvider を作成（MetaMask の window.ethereum を使用）
      const provider = new ethers.BrowserProvider(window.ethereum);
      // 接続済みのアカウント一覧を取得
      const accounts = await provider.listAccounts();

      // アカウントが接続されている場合
      if (accounts.length > 0) {
        // サインアーを取得（トランザクション署名に必要）
        const signer = await provider.getSigner();
        // 現在のネットワーク情報を取得
        const network = await provider.getNetwork();

        // 状態を更新
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0].address);
        setChainId(Number(network.chainId));
      }
    } catch (error) {
      // エラーが発生してもアプリをクラッシュさせない（ログのみ出力）
      console.error("Error checking connection:", error);
    }
  };

  /**
   * ネットワークをチェックし、必要に応じて Anvil Local に切り替える関数
   *
   * 現在のネットワークが期待されるネットワーク（Anvil Local）でない場合、
   * 自動的に切り替えます。
   *
   * @async
   * @returns {Promise<void>}
   */
  const checkAndSwitchNetwork = async () => {
    if (!isCorrectNetwork(chainId)) {
      try {
        await switchToAnvilNetwork();
        // ネットワーク切り替え後、接続を再確認して最新の状態を取得
        await checkConnection();
      } catch (error) {
        setError("ネットワークの切り替えに失敗しました: " + error.message);
      }
    }
  };

  /**
   * ウォレットを接続する関数
   *
   * MetaMask に接続をリクエストし、ユーザーが承認すると
   * アカウント情報を取得して状態を更新します。
   * 接続後、ネットワークが正しいかチェックし、必要に応じて自動的に切り替えます。
   *
   * @async
   * @returns {Promise<void>}
   * @throws {Error} MetaMask がインストールされていない場合
   * @throws {Error} ユーザーが接続を拒否した場合（error.code === 4001）
   */
  const connectWallet = async () => {
    // MetaMask がインストールされているか確認
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask がインストールされていません");
      return;
    }

    // 接続処理開始
    setIsConnecting(true);
    setError(null);

    try {
      // Ethers.js の BrowserProvider を作成
      const provider = new ethers.BrowserProvider(window.ethereum);
      // MetaMask に接続をリクエスト（ユーザーに承認ダイアログが表示される）
      await provider.send("eth_requestAccounts", []);

      // サインアーを取得（接続されたアカウントのサインアー）
      const signer = await provider.getSigner();
      // 接続されたアカウントのアドレスを取得
      const address = await signer.getAddress();
      // 現在のネットワーク情報を取得
      const network = await provider.getNetwork();

      // 状態を更新
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setChainId(Number(network.chainId));

      // 接続後にネットワークをチェック
      // 期待されるネットワーク（Anvil Local）でない場合、自動的に切り替える
      if (!isCorrectNetwork(Number(network.chainId))) {
        await switchToAnvilNetwork();
        // ネットワーク切り替え後、再度接続を確認して最新の状態を取得
        await checkConnection();
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);

      // エラーコードに応じて適切なエラーメッセージを設定
      let errorMessage = "ウォレット接続に失敗しました";
      if (error.code === 4001) {
        // ユーザーが接続を拒否した場合
        errorMessage = "接続が拒否されました";
      } else if (error.code === -32002) {
        // 既に接続リクエストが処理中の場合
        errorMessage = "既に接続リクエストが処理中です";
      } else if (error.message) {
        // その他のエラーメッセージがある場合
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      // 接続処理終了（成功・失敗に関わらず実行）
      setIsConnecting(false);
    }
  };

  /**
   * ウォレットを切断する関数
   *
   * 接続状態をリセットし、すべての状態を null に戻します。
   * 注意: この関数はローカルの状態のみをリセットします。
   * MetaMask 側の接続は切断されません（MetaMask の仕様上、アプリ側から切断できないため）。
   */
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  };

  /**
   * ネットワーク変更とアカウント変更のイベントを監視
   *
   * MetaMask でネットワークが変更されたり、アカウントが切り替えられた場合に
   * 自動的に状態を更新します。
   *
   * イベントリスナー:
   * - chainChanged: ネットワーク（チェーン）が変更されたときに発火
   * - accountsChanged: アカウントが変更されたときに発火
   */
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      /**
       * ネットワーク変更時のハンドラー
       *
       * ネットワークが変更された場合、チェーンIDを更新し、
       * 期待されるネットワーク（Anvil Local）でない場合は自動的に切り替えます。
       *
       * @param {string} chainId - 新しいチェーンID（16進数形式、例: "0x7a69"）
       */
      const handleChainChanged = async (chainId) => {
        const newChainId = Number(chainId);
        // チェーンIDを更新
        setChainId(newChainId);

        // 期待されるネットワーク（Anvil Local）でない場合、自動的に切り替える
        if (!isCorrectNetwork(newChainId)) {
          try {
            await switchToAnvilNetwork();
            // ネットワーク切り替え後、接続を再確認して最新の状態を取得
            await checkConnection();
          } catch (error) {
            console.error("Error switching network:", error);
            setError("ネットワークの切り替えに失敗しました: " + error.message);
          }
        } else {
          // 既に正しいネットワークの場合は、接続を再確認するだけ
          checkConnection();
        }
      };

      /**
       * アカウント変更時のハンドラー
       *
       * @param {string[]} accounts - 接続中のアカウントアドレスの配列
       */
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // アカウントが切断された場合（ユーザーがMetaMaskで切断した場合など）
          disconnectWallet();
        } else {
          // アカウントが変更された場合（別のアカウントに切り替えた場合など）
          checkConnection();
        }
      };

      // イベントリスナーを登録
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      // クリーンアップ関数（コンポーネントのアンマウント時にイベントリスナーを削除）
      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, []);

  /**
   * フックの戻り値
   *
   * コンポーネントで使用できる状態と関数を返します。
   */
  return {
    account, // 接続中のウォレットアドレス（例: "0x1234..."）
    provider, // Ethers.js プロバイダー（ブロックチェーンとの通信に使用）
    signer, // サインアー（トランザクション署名に使用）
    isConnecting, // 接続処理中の状態（true: 接続中, false: 接続完了/未接続）
    chainId, // 現在のチェーンID（例: 31337 = Anvil Local）
    error, // エラーメッセージ（接続失敗時など）
    connectWallet, // ウォレット接続関数（ボタンクリック時に呼び出す）
    disconnectWallet, // ウォレット切断関数（ローカル状態のみリセット）
    checkAndSwitchNetwork, // ネットワークチェック・切り替え関数
    isConnected: !!account, // 接続状態の真偽値（account が存在するかどうか）
  };
}
