import { storage } from "./storage";

/**
 * ブロックチェーンとローカルストレージの同期ユーティリティ
 *
 * ブロックチェーンから取得したデータとローカルストレージのデータを同期し、
 * 差分を検出する機能を提供します。
 *
 * 主な機能:
 * - スタンプの同期（ブロックチェーン → ローカルストレージ）
 * - NFT の同期（ブロックチェーン → ローカルストレージ）
 * - スタンプの差分検出（追加・削除・更新）
 * - NFT の差分検出（追加・削除・更新）
 */
export const sync = {
  /**
   * スタンプを同期する
   *
   * ブロックチェーンから取得したスタンプをローカルストレージに保存します。
   * これにより、次回アクセス時にブロックチェーンへのリクエストを減らし、
   * パフォーマンスを向上させることができます。
   *
   * 使用例:
   * ```javascript
   * const blockchainStamps = await stampManagerContract.getUserStamps(account);
   * const syncedStamps = sync.syncStamps(blockchainStamps);
   * ```
   *
   * @param {Array} blockchainStamps - ブロックチェーンから取得したスタンプ配列
   * @returns {Array} 同期後のスタンプ配列
   * @throws {Error} 同期に失敗した場合
   */
  syncStamps: (blockchainStamps) => {
    try {
      /**
       * ブロックチェーンのスタンプをローカルストレージに保存
       *
       * データが存在し、かつ配列が空でない場合のみ保存します。
       * これにより、空の配列で上書きされることを防ぎます。
       */
      if (blockchainStamps && blockchainStamps.length > 0) {
        storage.saveStamps(blockchainStamps);
        return blockchainStamps;
      }
      // データが存在しない場合は空配列を返す
      return [];
    } catch (err) {
      /**
       * エラーハンドリング: 同期に失敗した場合
       *
       * ローカルストレージの容量不足や、データ形式のエラーが発生した場合に
       * エラーが発生します。エラーログを出力し、エラーを再スローします。
       */
      console.error("Error syncing stamps:", err);
      throw new Error("スタンプの同期に失敗しました");
    }
  },

  /**
   * NFT を同期する
   *
   * ブロックチェーンから取得した NFT をローカルストレージに保存します。
   * これにより、次回アクセス時にブロックチェーンへのリクエストを減らし、
   * パフォーマンスを向上させることができます。
   *
   * 使用例:
   * ```javascript
   * const blockchainNFTs = await loadNFTsFromBlockchain();
   * const syncedNFTs = sync.syncNFTs(blockchainNFTs);
   * ```
   *
   * @param {Array} blockchainNFTs - ブロックチェーンから取得した NFT 配列
   * @returns {Array} 同期後の NFT 配列
   * @throws {Error} 同期に失敗した場合
   */
  syncNFTs: (blockchainNFTs) => {
    try {
      /**
       * ブロックチェーンの NFT をローカルストレージに保存
       *
       * データが存在し、かつ配列が空でない場合のみ保存します。
       * これにより、空の配列で上書きされることを防ぎます。
       */
      if (blockchainNFTs && blockchainNFTs.length > 0) {
        storage.saveNFTs(blockchainNFTs);
        return blockchainNFTs;
      }
      // データが存在しない場合は空配列を返す
      return [];
    } catch (err) {
      /**
       * エラーハンドリング: 同期に失敗した場合
       *
       * ローカルストレージの容量不足や、データ形式のエラーが発生した場合に
       * エラーが発生します。エラーログを出力し、エラーを再スローします。
       */
      console.error("Error syncing NFTs:", err);
      throw new Error("NFTの同期に失敗しました");
    }
  },

  /**
   * スタンプの差分を検出する
   *
   * ブロックチェーンのスタンプとローカルストレージのスタンプを比較し、
   * 追加・削除・更新されたスタンプを検出します。
   *
   * 使用例:
   * ```javascript
   * const blockchainStamps = await stampManagerContract.getUserStamps(account);
   * const localStamps = storage.getStamps();
   * const diff = sync.detectStampDiff(blockchainStamps, localStamps);
   *
   * if (diff.added.length > 0) {
   *   console.log("新しいスタンプが追加されました:", diff.added);
   * }
   * ```
   *
   * @param {Array} blockchainStamps - ブロックチェーンから取得したスタンプ配列
   * @param {Array} localStamps - ローカルストレージから取得したスタンプ配列
   * @returns {Object} 差分情報
   * @returns {Array} added - 追加されたスタンプの配列
   * @returns {Array} removed - 削除されたスタンプの配列（通常は空、ブロックチェーンでは削除不可）
   * @returns {Array} updated - 更新されたスタンプの配列（簡易版：常に更新とみなす）
   */
  detectStampDiff: (blockchainStamps, localStamps) => {
    /**
     * 追加・削除・更新されたスタンプを格納する配列
     */
    const added = [];
    const removed = [];
    const updated = [];

    /**
     * ステップ1: ブロックチェーンのスタンプを ID でマップ
     *
     * Map オブジェクトを使用して、スタンプ ID をキーとしてスタンプデータを格納します。
     * これにより、O(1) の時間計算量でスタンプを検索できます。
     */
    const blockchainMap = new Map();
    blockchainStamps.forEach((stamp) => {
      blockchainMap.set(stamp.id, stamp);
    });

    /**
     * ステップ2: ローカルストレージのスタンプを ID でマップ
     *
     * 同様に、ローカルストレージのスタンプも Map オブジェクトに格納します。
     */
    const localMap = new Map();
    localStamps.forEach((stamp) => {
      localMap.set(stamp.id, stamp);
    });

    /**
     * ステップ3: 追加されたスタンプを検出
     *
     * ブロックチェーンのスタンプをループ処理し、
     * ローカルストレージに存在しないスタンプを「追加されたスタンプ」として検出します。
     */
    blockchainMap.forEach((stamp, id) => {
      if (!localMap.has(id)) {
        // ローカルストレージに存在しない = 新しく追加されたスタンプ
        added.push(stamp);
      } else {
        /**
         * ステップ4: 更新されたスタンプを検出（簡易版）
         *
         * 現在の実装では、ブロックチェーンのスタンプが常に最新であると仮定し、
         * ローカルストレージに存在するスタンプも「更新されたスタンプ」として扱います。
         *
         * 将来的な改善:
         * - タイムスタンプやハッシュ値を比較して、実際に変更があった場合のみ更新とみなす
         * - 特定のフィールド（name, organization など）のみを比較する
         */
        updated.push(stamp);
      }
    });

    /**
     * ステップ5: 削除されたスタンプを検出
     *
     * ローカルストレージのスタンプをループ処理し、
     * ブロックチェーンに存在しないスタンプを「削除されたスタンプ」として検出します。
     *
     * 注意: ブロックチェーンではスタンプの削除はできないため、
     * 通常はこの配列は空になります。ただし、以下の場合に削除とみなされる可能性があります：
     * - ローカルストレージに古いデータが残っている場合
     * - データの整合性が取れていない場合
     */
    localMap.forEach((stamp, id) => {
      if (!blockchainMap.has(id)) {
        // ブロックチェーンに存在しない = 削除されたスタンプ（または古いデータ）
        removed.push(stamp);
      }
    });

    /**
     * 差分情報を返す
     *
     * 追加・削除・更新されたスタンプの情報を返します。
     * これにより、UI で変更を通知したり、ログを出力したりできます。
     */
    return { added, removed, updated };
  },

  /**
   * NFT の差分を検出する
   *
   * ブロックチェーンの NFT とローカルストレージの NFT を比較し、
   * 追加・削除・更新された NFT を検出します。
   *
   * 使用例:
   * ```javascript
   * const blockchainNFTs = await loadNFTsFromBlockchain();
   * const localNFTs = storage.getNFTs();
   * const diff = sync.detectNFTDiff(blockchainNFTs, localNFTs);
   *
   * if (diff.added.length > 0) {
   *   console.log("新しい NFT が追加されました:", diff.added);
   * }
   * ```
   *
   * @param {Array} blockchainNFTs - ブロックチェーンから取得した NFT 配列
   * @param {Array} localNFTs - ローカルストレージから取得した NFT 配列
   * @returns {Object} 差分情報
   * @returns {Array} added - 追加された NFT の配列
   * @returns {Array} removed - 削除された NFT の配列（通常は空、ブロックチェーンでは削除不可）
   * @returns {Array} updated - 更新された NFT の配列（簡易版：常に更新とみなす）
   */
  detectNFTDiff: (blockchainNFTs, localNFTs) => {
    /**
     * 追加・削除・更新された NFT を格納する配列
     */
    const added = [];
    const removed = [];
    const updated = [];

    /**
     * ステップ1: ブロックチェーンの NFT を ID でマップ
     *
     * Map オブジェクトを使用して、NFT ID をキーとして NFT データを格納します。
     * これにより、O(1) の時間計算量で NFT を検索できます。
     */
    const blockchainMap = new Map();
    blockchainNFTs.forEach((nft) => {
      blockchainMap.set(nft.id, nft);
    });

    /**
     * ステップ2: ローカルストレージの NFT を ID でマップ
     *
     * 同様に、ローカルストレージの NFT も Map オブジェクトに格納します。
     */
    const localMap = new Map();
    localNFTs.forEach((nft) => {
      localMap.set(nft.id, nft);
    });

    /**
     * ステップ3: 追加された NFT を検出
     *
     * ブロックチェーンの NFT をループ処理し、
     * ローカルストレージに存在しない NFT を「追加された NFT」として検出します。
     */
    blockchainMap.forEach((nft, id) => {
      if (!localMap.has(id)) {
        // ローカルストレージに存在しない = 新しく追加された NFT
        added.push(nft);
      } else {
        /**
         * ステップ4: 更新された NFT を検出（簡易版）
         *
         * 現在の実装では、ブロックチェーンの NFT が常に最新であると仮定し、
         * ローカルストレージに存在する NFT も「更新された NFT」として扱います。
         *
         * 将来的な改善:
         * - タイムスタンプやハッシュ値を比較して、実際に変更があった場合のみ更新とみなす
         * - 特定のフィールド（name, rarity など）のみを比較する
         */
        updated.push(nft);
      }
    });

    /**
     * ステップ5: 削除された NFT を検出
     *
     * ローカルストレージの NFT をループ処理し、
     * ブロックチェーンに存在しない NFT を「削除された NFT」として検出します。
     *
     * 注意: ブロックチェーンでは NFT の削除（バーン）は可能ですが、
     * 通常はこの配列は空になります。ただし、以下の場合に削除とみなされる可能性があります：
     * - NFT がバーンされた場合
     * - ローカルストレージに古いデータが残っている場合
     * - データの整合性が取れていない場合
     */
    localMap.forEach((nft, id) => {
      if (!blockchainMap.has(id)) {
        // ブロックチェーンに存在しない = 削除された NFT（または古いデータ）
        removed.push(nft);
      }
    });

    /**
     * 差分情報を返す
     *
     * 追加・削除・更新された NFT の情報を返します。
     * これにより、UI で変更を通知したり、ログを出力したりできます。
     */
    return { added, removed, updated };
  },
};
