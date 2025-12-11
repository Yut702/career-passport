import { ethers } from "ethers";

/**
 * Anvil ローカルネットワークの設定
 *
 * MetaMask に追加するネットワーク情報を定義します。
 * Chain ID 31337 は Anvil のデフォルトチェーンIDです。
 */
const ANVIL_NETWORK = {
  chainId: "0x7A69", // 31337 in hex (0x7A69 = 31337)
  chainName: "Anvil Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["http://localhost:8545"],
  blockExplorerUrls: [], // ローカルネットワークなのでブロックエクスプローラーは不要
};

/**
 * MetaMask を Anvil ローカルネットワークに切り替える関数
 *
 * 現在のネットワークが Anvil Local でない場合、自動的に切り替えます。
 * ネットワークが MetaMask に登録されていない場合は、自動的に追加します。
 *
 * @async
 * @returns {Promise<void>}
 * @throws {Error} MetaMask がインストールされていない場合
 * @throws {Error} ネットワークの切り替えに失敗した場合
 *
 * @example
 * ```javascript
 * try {
 *   await switchToAnvilNetwork();
 *   console.log("ネットワークを切り替えました");
 * } catch (error) {
 *   console.error("ネットワーク切り替えエラー:", error);
 * }
 * ```
 */
export async function switchToAnvilNetwork() {
  // MetaMask がインストールされているか確認
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask がインストールされていません");
  }

  try {
    // 現在のネットワークを取得
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    // 既に正しいネットワーク（Anvil Local）に接続されている場合
    if (currentChainId === 31337) {
      return; // 何もする必要がない
    }

    // ネットワークを切り替えまたは追加
    try {
      // まず、既存のネットワークに切り替えを試みる
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ANVIL_NETWORK.chainId }],
      });
    } catch (switchError) {
      // エラーコード 4902 は「ネットワークが存在しない」ことを意味する
      if (switchError.code === 4902) {
        // ネットワークが存在しない場合は、MetaMask に追加する
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ANVIL_NETWORK],
        });
      } else {
        // その他のエラー（ユーザーが拒否した場合など）は再スロー
        throw switchError;
      }
    }
  } catch (error) {
    console.error("Error switching network:", error);
    throw error;
  }
}

/**
 * 期待されるチェーンIDを取得する関数
 *
 * 環境変数 `VITE_CHAIN_ID` からチェーンIDを取得します。
 * 環境変数が設定されていない場合は、デフォルト値 31337（Anvil Local）を返します。
 *
 * @returns {string} チェーンID（文字列形式）
 *
 * @example
 * ```javascript
 * const chainId = getExpectedChainId(); // "31337"
 * ```
 */
export function getExpectedChainId() {
  return import.meta.env.VITE_CHAIN_ID || "31337";
}

/**
 * 現在のチェーンIDが期待されるネットワークと一致するか確認する関数
 *
 * @param {number|string} chainId - 確認するチェーンID
 * @returns {boolean} 期待されるネットワークと一致する場合 true
 *
 * @example
 * ```javascript
 * const isCorrect = isCorrectNetwork(31337); // true (Anvil Local)
 * const isCorrect = isCorrectNetwork(1); // false (Ethereum Mainnet)
 * ```
 */
export function isCorrectNetwork(chainId) {
  return Number(chainId) === Number(getExpectedChainId());
}
