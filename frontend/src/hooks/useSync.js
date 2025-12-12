import { useState, useCallback } from "react";
import { sync } from "../lib/sync";

/**
 * ブロックチェーンとローカルストレージの同期を管理するカスタムフック
 *
 * ブロックチェーンから取得したデータをローカルストレージに同期する機能を提供します。
 * 同期処理の状態（進行中、エラー）を管理し、UI で同期状態を表示できます。
 *
 * 使用例:
 * ```javascript
 * function MyComponent() {
 *   const { syncing, syncError, syncStamps, syncNFTs } = useSync();
 *
 *   const handleSync = async () => {
 *     try {
 *       const blockchainStamps = await loadStampsFromBlockchain();
 *       await syncStamps(blockchainStamps);
 *       console.log("同期完了");
 *     } catch (error) {
 *       console.error("同期エラー:", error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {syncing && <p>同期中...</p>}
 *       {syncError && <p>エラー: {syncError}</p>}
 *       <button onClick={handleSync}>同期する</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns {Object} 同期状態と操作関数
 * @returns {boolean} syncing - 同期処理中の状態（true: 同期中, false: 同期完了/未実行）
 * @returns {string|null} syncError - 同期エラーメッセージ（エラーがない場合は null）
 * @returns {Function} syncStamps - スタンプを同期する関数
 * @returns {Function} syncNFTs - NFT を同期する関数
 */
export function useSync() {
  /**
   * 同期処理中の状態
   *
   * true の場合、同期処理が進行中であることを示します。
   * UI でローディング表示などに使用できます。
   */
  const [syncing, setSyncing] = useState(false);

  /**
   * 同期エラーメッセージ
   *
   * 同期処理中にエラーが発生した場合、エラーメッセージが設定されます。
   * エラーがない場合は null です。
   */
  const [syncError, setSyncError] = useState(null);

  /**
   * スタンプを同期する関数
   *
   * ブロックチェーンから取得したスタンプをローカルストレージに保存します。
   * 同期処理の状態を管理し、エラーが発生した場合はエラーメッセージを設定します。
   *
   * useCallback でメモ化することで、依存関係が変更されない限り
   * 関数の再作成を防ぎ、パフォーマンスを向上させます。
   *
   * 使用例:
   * ```javascript
   * const blockchainStamps = await stampManagerContract.getUserStamps(account);
   * const syncedStamps = await syncStamps(blockchainStamps);
   * ```
   *
   * @async
   * @param {Array} blockchainStamps - ブロックチェーンから取得したスタンプ配列
   * @returns {Promise<Array>} 同期後のスタンプ配列
   * @throws {Error} 同期に失敗した場合
   */
  const syncStamps = useCallback(async (blockchainStamps) => {
    /**
     * 同期処理を開始
     *
     * 同期処理が開始されたことを示すため、syncing を true に設定します。
     * また、前回のエラーメッセージをクリアします。
     */
    setSyncing(true);
    setSyncError(null);

    try {
      /**
       * スタンプを同期
       *
       * sync.syncStamps() を呼び出して、ブロックチェーンのスタンプを
       * ローカルストレージに保存します。
       * この関数は同期的に動作しますが、将来的に非同期処理（例: バックエンドAPIへの送信）
       * を追加する可能性を考慮して、async/await を使用しています。
       */
      const syncedStamps = sync.syncStamps(blockchainStamps);

      /**
       * 同期後のスタンプ配列を返す
       *
       * 呼び出し元で、同期後のデータを使用できます。
       */
      return syncedStamps;
    } catch (error) {
      /**
       * エラーハンドリング: 同期に失敗した場合
       *
       * 同期処理中にエラーが発生した場合、エラーログを出力し、
       * エラーメッセージを状態に設定します。
       * エラーを再スローすることで、呼び出し元でもエラーを処理できます。
       */
      console.error("Error syncing stamps:", error);
      setSyncError(error.message);
      throw error;
    } finally {
      /**
       * 同期処理を終了
       *
       * 成功・失敗に関わらず、同期処理が終了したことを示すため、
       * syncing を false に設定します。
       */
      setSyncing(false);
    }
  }, []);

  /**
   * NFT を同期する関数
   *
   * ブロックチェーンから取得した NFT をローカルストレージに保存します。
   * 同期処理の状態を管理し、エラーが発生した場合はエラーメッセージを設定します。
   *
   * useCallback でメモ化することで、依存関係が変更されない限り
   * 関数の再作成を防ぎ、パフォーマンスを向上させます。
   *
   * 使用例:
   * ```javascript
   * const blockchainNFTs = await loadNFTsFromBlockchain();
   * const syncedNFTs = await syncNFTs(blockchainNFTs);
   * ```
   *
   * @async
   * @param {Array} blockchainNFTs - ブロックチェーンから取得した NFT 配列
   * @returns {Promise<Array>} 同期後の NFT 配列
   * @throws {Error} 同期に失敗した場合
   */
  const syncNFTs = useCallback(async (blockchainNFTs) => {
    /**
     * 同期処理を開始
     *
     * 同期処理が開始されたことを示すため、syncing を true に設定します。
     * また、前回のエラーメッセージをクリアします。
     */
    setSyncing(true);
    setSyncError(null);

    try {
      /**
       * NFT を同期
       *
       * sync.syncNFTs() を呼び出して、ブロックチェーンの NFT を
       * ローカルストレージに保存します。
       * この関数は同期的に動作しますが、将来的に非同期処理（例: バックエンドAPIへの送信）
       * を追加する可能性を考慮して、async/await を使用しています。
       */
      const syncedNFTs = sync.syncNFTs(blockchainNFTs);

      /**
       * 同期後の NFT 配列を返す
       *
       * 呼び出し元で、同期後のデータを使用できます。
       */
      return syncedNFTs;
    } catch (error) {
      /**
       * エラーハンドリング: 同期に失敗した場合
       *
       * 同期処理中にエラーが発生した場合、エラーログを出力し、
       * エラーメッセージを状態に設定します。
       * エラーを再スローすることで、呼び出し元でもエラーを処理できます。
       */
      console.error("Error syncing NFTs:", error);
      setSyncError(error.message);
      throw error;
    } finally {
      /**
       * 同期処理を終了
       *
       * 成功・失敗に関わらず、同期処理が終了したことを示すため、
       * syncing を false に設定します。
       */
      setSyncing(false);
    }
  }, []);

  /**
   * フックの戻り値
   *
   * コンポーネントで使用できる同期状態と操作関数を返します。
   */
  return {
    syncing, // 同期処理中の状態（true: 同期中, false: 同期完了/未実行）
    syncError, // 同期エラーメッセージ（エラーがない場合は null）
    syncStamps, // スタンプを同期する関数
    syncNFTs, // NFT を同期する関数
  };
}
