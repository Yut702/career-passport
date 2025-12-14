import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import NonFungibleCareerNFTABI from "../abis/NonFungibleCareerNFT.json";
import StampManagerABI from "../abis/StampManager.json";

// ABIがデフォルトエクスポートの場合に備えて、配列形式を保証
const getABI = (abi) => {
  if (Array.isArray(abi)) {
    return abi;
  }
  if (abi && abi.default && Array.isArray(abi.default)) {
    return abi.default;
  }
  if (abi && abi.abi && Array.isArray(abi.abi)) {
    return abi.abi;
  }
  return abi;
};

/**
 * コントラクトインスタンスを管理するカスタムフック
 *
 * ウォレットが接続されている場合、コントラクトのインスタンスを作成し、
 * トランザクション送信や読み取り操作に使用できるようにします。
 *
 * @returns {Object} コントラクトインスタンスと状態
 * @returns {ethers.Contract|null} nftContract - NonFungibleCareerNFT コントラクトインスタンス（NFT証明書）
 * @returns {ethers.Contract|null} stampManagerContract - StampManager コントラクトインスタンス（スタンプとNFTを管理）
 * @returns {boolean} isLoading - コントラクト読み込み中の状態
 * @returns {boolean} isReady - すべてのコントラクトが読み込み完了したかどうか
 *
 * @example
 * ```javascript
 * function MyComponent() {
 *   const { nftContract, stampManagerContract, isReady } = useContracts();
 *
 *   if (!isReady) {
 *     return <div>コントラクトを読み込み中...</div>;
 *   }
 *
 *   // コントラクトを使用
 *   // スタンプはStampManager経由でアクセス
 *   const handleMint = async () => {
 *     await stampManagerContract.mintNft(...);
 *   };
 * }
 * ```
 */
export function useContracts() {
  // useWallet フックから接続状態を取得
  const { signer, isConnected } = useWallet();

  // NonFungibleCareerNFT コントラクトのインスタンス（NFT証明書）
  const [nftContract, setNftContract] = useState(null);
  // StampManager コントラクトのインスタンス（スタンプとNFTを管理）
  const [stampManagerContract, setStampManagerContract] = useState(null);
  // コントラクト読み込み中の状態
  const [isLoading, setIsLoading] = useState(false);

  /**
   * コントラクトインスタンスを読み込む関数
   *
   * 環境変数からコントラクトアドレスを取得し、
   * Ethers.js の Contract クラスを使用してインスタンスを作成します。
   *
   * @async
   * @returns {Promise<void>}
   * @throws {Error} コントラクトアドレスが設定されていない場合
   */
  const loadContracts = useCallback(async () => {
    // サインアーが存在しない場合は何もしない
    if (!signer) return;

    setIsLoading(true);
    try {
      // 環境変数からコントラクトアドレスを取得
      const nftAddress = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
      const stampManagerAddress = import.meta.env.VITE_STAMP_MANAGER_ADDRESS;
      // 注意: スタンプ（SFT）はStampManager経由でアクセスするため、SFTコントラクトの環境変数は不要

      // コントラクトアドレスが設定されているか確認
      if (!nftAddress || !stampManagerAddress) {
        throw new Error("コントラクトアドレスが設定されていません");
      }

      // NonFungibleCareerNFT コントラクトインスタンスを作成（NFT証明書）
      const nftABI = getABI(NonFungibleCareerNFTABI);
      const nft = new ethers.Contract(nftAddress, nftABI, signer);

      // StampManager コントラクトインスタンスを作成（スタンプとNFTを管理）
      const stampManagerABI = getABI(StampManagerABI);
      const stampManager = new ethers.Contract(
        stampManagerAddress,
        stampManagerABI,
        signer
      );

      // 状態を更新
      setNftContract(nft);
      setStampManagerContract(stampManager);
    } catch (error) {
      console.error("Error loading contracts:", error);
      // エラーが発生した場合、コントラクトインスタンスをクリア
      setNftContract(null);
      setStampManagerContract(null);
    } finally {
      // 読み込み処理終了（成功・失敗に関わらず実行）
      setIsLoading(false);
    }
  }, [signer]);

  /**
   * ウォレット接続状態が変更されたときにコントラクトを読み込む
   *
   * ウォレットが接続されている場合、コントラクトインスタンスを作成します。
   * ウォレットが切断された場合、コントラクトインスタンスをクリアします。
   */
  useEffect(() => {
    if (isConnected && signer) {
      loadContracts();
    } else {
      // ウォレットが切断された場合、コントラクトインスタンスをクリア
      setNftContract(null);
      setStampManagerContract(null);
    }
  }, [isConnected, signer, loadContracts]);

  /**
   * フックの戻り値
   *
   * コンポーネントで使用できるコントラクトインスタンスと状態を返します。
   */
  return {
    nftContract, // NonFungibleCareerNFT コントラクトインスタンス（NFT証明書、null の場合は未読み込み）
    stampManagerContract, // StampManager コントラクトインスタンス（スタンプとNFTを管理、null の場合は未読み込み）
    isLoading, // コントラクト読み込み中の状態（true: 読み込み中, false: 読み込み完了/未読み込み）
    isReady: !!nftContract && !!stampManagerContract, // すべてのコントラクトが読み込み完了したかどうか
  };
}
