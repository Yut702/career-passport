import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import { useWalletConnect } from "../hooks/useWalletConnect";
import { storage } from "../lib/storage";
import { getStampEmoji, getStampGradient } from "../lib/imageTypes";

/**
 * 企業ダッシュボード（企業向け管理画面）
 *
 * ブロックチェーンから統計情報を読み込み、企業の活動状況を表示します。
 * ウォレットが接続されていない場合は、ローカルストレージから読み込みます（フォールバック）。
 *
 * 注意: 現在のコントラクト実装では、全ユーザーのスタンプを取得する機能がないため、
 * 一部の統計情報は簡易的な実装になっています。
 * 実際の実装では、イベントログを解析するか、別のコントラクト関数を追加する必要があります。
 */
export default function OrgDashboard() {
  // コントラクトインスタンスを取得
  const { nftContract, stampManagerContract, isReady } = useContracts();
  // ウォレット接続状態を取得
  const { account, isConnected } = useWalletConnect();

  // 状態管理
  const [stats, setStats] = useState({
    totalStamps: 0, // 発行済みスタンプ総数
    totalUsers: 0, // 参加者数（スタンプを受け取ったユーザー数）
    totalNFTs: 0, // NFT 発行総数
  });
  const [recentStamps, setRecentStamps] = useState([]); // 最近発行したスタンプのリスト
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organization, setOrganization] = useState(null); // 組織名

  /**
   * ローカルストレージからデータを読み込む関数（フォールバック）
   *
   * ウォレットが接続されていない場合や、ブロックチェーンからの読み込みに失敗した場合に使用します。
   * ローカルストレージに保存されたデータを読み込み、統計情報を計算します。
   *
   * useCallback でメモ化することで、関数の再作成を防ぎます。
   * この関数は依存関係がないため、常に同じ関数インスタンスを返します。
   *
   * @async
   * @returns {Promise<void>}
   */
  const loadDataFromStorage = useCallback(() => {
    try {
      /**
       * モックデータの初期化
       *
       * ローカルストレージからデータを取得
       *
       * 以下のデータをローカルストレージから取得します：
       * - スタンプデータ
       * - NFT データ
       */
      const stamps = storage.getStamps();
      const nfts = storage.getNFTs();

      /**
       * 統計情報を計算
       *
       * ローカルストレージのデータから統計情報を計算します：
       * - totalStamps: スタンプの総数
       * - totalUsers: ユニークなユーザー数（スタンプの id から計算）
       * - totalNFTs: NFT の総数
       *
       * 注意: ユニークなユーザー数は、スタンプデータに含まれるユーザーアドレス（userAddress）
       * を使用して計算します。同じユーザーアドレスに複数のスタンプを発行した場合でも、
       * 1人としてカウントされます。
       */
      const uniqueUsers = new Set(
        stamps
          .filter((s) => s.userAddress) // ユーザーアドレスが存在するスタンプのみをフィルタリング
          .map((s) => s.userAddress.toLowerCase()) // 大文字・小文字を区別しないように小文字に変換
      );
      setStats({
        totalStamps: stamps.length || 0, // スタンプの総数
        totalUsers: uniqueUsers.size || 0, // ユニークなユーザー数
        totalNFTs: nfts.length || 0, // NFT の総数
      });

      /**
       * 最近発行したスタンプを取得
       *
       * スタンプ配列の最後の5件を取得し、新しい順（逆順）に並べ替えます。
       * これにより、ダッシュボードに「最近の発行」セクションを表示できます。
       */
      setRecentStamps(
        stamps && stamps.length > 0 ? stamps.slice(-5).reverse() : []
      );
    } catch (err) {
      /**
       * エラーハンドリング: ローカルストレージからの読み込みに失敗した場合
       *
       * ローカルストレージが無効な場合や、データが破損している場合にエラーが発生します。
       */
      console.error("Error loading dashboard from storage:", err);
      setError("データの読み込みに失敗しました");
    } finally {
      /**
       * ローディング状態を解除
       */
      setLoading(false);
    }
  }, []);

  /**
   * 企業の組織名を取得
   */
  const loadOrganization = useCallback(async () => {
    if (!stampManagerContract || !account || !isReady) {
      console.log(
        "loadOrganization: コントラクトまたはアカウントが準備できていません"
      );
      setOrganization("");
      return;
    }

    try {
      // コントラクトが存在するか確認
      const contractCode = await stampManagerContract.runner.provider.getCode(
        stampManagerContract.target
      );
      if (contractCode === "0x" || contractCode === "0x0") {
        // コントラクトが存在しない場合は初期状態として扱う
        setOrganization("");
        return;
      }

      console.log("loadOrganization: 組織名を取得中...", { account });
      const orgName = await stampManagerContract.issuerOrganization(account);
      console.log("loadOrganization: 組織名を取得完了", { orgName, account });
      if (orgName && orgName.trim() !== "") {
        setOrganization(orgName);
      } else {
        console.warn("loadOrganization: 組織名が設定されていません。");
        setOrganization("");
      }
    } catch (err) {
      // コントラクトが存在しない、またはデータが存在しない場合は初期状態として扱う
      if (
        err.code === "BAD_DATA" ||
        err.message?.includes("could not decode result data") ||
        err.message?.includes('value="0x"')
      ) {
        // 初期状態として扱う（エラーを表示しない）
        setOrganization("");
        return;
      }
      console.error("loadOrganization: エラー", err);
      setOrganization("");
    }
  }, [stampManagerContract, account, isReady]);

  /**
   * ブロックチェーンからデータを読み込む関数
   *
   * 企業ダッシュボードに表示する統計情報をブロックチェーンから取得します。
   * 接続されているアカウント（組織）が発行したスタンプとNFTを取得します。
   *
   * useCallback でメモ化することで、依存関係が変更されない限り
   * 関数の再作成を防ぎ、パフォーマンスを向上させます。
   *
   * @async
   * @returns {Promise<void>}
   * @throws {Error} コントラクトが読み込まれていない場合
   * @throws {Error} ブロックチェーンからの読み込みに失敗した場合
   */
  const loadData = useCallback(async () => {
    // コントラクトが存在しない場合は処理を中断
    if (!stampManagerContract || !nftContract || !account || !isReady) {
      console.log(
        "loadData: コントラクトまたはアカウントが準備できていません",
        {
          stampManagerContract: !!stampManagerContract,
          nftContract: !!nftContract,
          account,
          isReady,
        }
      );
      return;
    }

    console.log("loadData: データを読み込み開始", { account });
    setLoading(true);
    setError(null);

    try {
      /**
       * ステップ1: 組織が発行したスタンプを取得（StampIssuedイベントから）
       */
      const filter = stampManagerContract.filters.StampIssued();
      const events = await stampManagerContract.queryFilter(filter);

      const issuedStamps = [];
      const seenTokenIds = new Set(); // 重複を防ぐ
      const uniqueUsers = new Set(); // ユニークなユーザー数を計算

      for (const event of events) {
        try {
          const eventArgs = event.args;
          const eventIssuer = eventArgs.issuer; // 発行者アドレス
          const tokenId = eventArgs.tokenId;

          // 発行者アドレスが一致する場合のみ追加（接続中のアカウントが発行者）
          const isIssuerMatch =
            eventIssuer && account
              ? eventIssuer.toLowerCase() === account.toLowerCase()
              : false;

          // 発行者アドレスが一致する場合のみ追加（組織名は考慮しない）
          if (isIssuerMatch && !seenTokenIds.has(tokenId.toString())) {
            seenTokenIds.add(tokenId.toString());

            // スタンプのメタデータを取得
            const metadata = await stampManagerContract.getStampMetadata(
              tokenId
            );
            const stampName = Array.isArray(metadata)
              ? metadata[0]
              : metadata.name;
            const stampOrganization = Array.isArray(metadata)
              ? metadata[1]
              : metadata.organization;
            const stampCategory = Array.isArray(metadata)
              ? metadata[2]
              : metadata.category;
            const stampCreatedAt = Array.isArray(metadata)
              ? metadata[3]
              : metadata.createdAt;
            const stampImageType = Array.isArray(metadata)
              ? metadata[5] !== undefined
                ? Number(metadata[5])
                : 0
              : metadata.imageType !== undefined
              ? Number(metadata.imageType)
              : 0;

            // ユーザーアドレスを追加（参加者数の計算用）
            const userAddress = eventArgs.user.toLowerCase();
            uniqueUsers.add(userAddress);

            issuedStamps.push({
              id: `stamp_${tokenId}`,
              tokenId: tokenId.toString(),
              name: stampName,
              organization: stampOrganization,
              category: stampCategory,
              issuedAt: new Date(Number(stampCreatedAt) * 1000)
                .toISOString()
                .split("T")[0],
              userAddress: eventArgs.user,
              imageType: stampImageType,
            });
          }
        } catch (err) {
          console.warn(`イベント処理エラー:`, err);
        }
      }

      // 発行日順（新しい順）にソート
      issuedStamps.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

      /**
       * ステップ2: 組織が発行したNFTを取得
       */
      let totalSupply = 0;
      let totalSupplyNumber = 0;
      try {
        // コントラクトが存在するか確認
        const contractCode = await nftContract.runner.provider.getCode(
          nftContract.target
        );
        if (contractCode !== "0x" && contractCode !== "0x0") {
          totalSupply = await nftContract.getTotalSupply();
          totalSupplyNumber = Number(totalSupply);
        }
      } catch (err) {
        // コントラクトが存在しない、またはデータが存在しない場合は0として扱う
        if (
          err.code === "BAD_DATA" ||
          err.message?.includes("could not decode result data") ||
          err.message?.includes('value="0x"')
        ) {
          // 初期状態として扱う（エラーを表示しない）
          totalSupplyNumber = 0;
        } else {
          console.warn("getTotalSupply: エラー", err);
        }
      }
      let totalNFTs = 0;

      for (let i = 0; i < totalSupplyNumber; i++) {
        try {
          // NFTの発行者アドレスを取得
          const issuer = await nftContract.getTokenIssuer(i); // 発行者アドレスを取得

          // 発行者アドレスが一致する場合のみカウント（接続中のアカウントが発行者）
          const isIssuerMatch =
            issuer && account
              ? issuer.toLowerCase() === account.toLowerCase()
              : false;

          // 発行者アドレスが一致する場合のみカウント（組織名は考慮しない）
          if (isIssuerMatch) {
            totalNFTs++;
          }
        } catch (err) {
          // トークンが存在しない場合はスキップ
          console.warn(`Token ${i} does not exist:`, err);
        }
      }

      /**
       * 統計情報を設定
       */
      const newStats = {
        totalStamps: issuedStamps.length,
        totalUsers: uniqueUsers.size,
        totalNFTs: totalNFTs,
      };
      console.log("loadData: 統計情報を設定", newStats, {
        account,
      });
      setStats(newStats);

      /**
       * 最近発行したスタンプを取得（最後の5件）
       */
      setRecentStamps(issuedStamps.slice(0, 5));
    } catch (err) {
      /**
       * エラーハンドリング: ブロックチェーンからの読み込みに失敗した場合
       */
      // コントラクトが存在しない、またはデータが存在しない場合は初期状態として扱う
      if (
        err.code === "BAD_DATA" ||
        err.message?.includes("could not decode result data") ||
        err.message?.includes('value="0x"')
      ) {
        // 初期状態として扱う（エラーを表示しない）
        setStats({
          totalStamps: 0,
          totalUsers: 0,
          totalNFTs: 0,
        });
        setRecentStamps([]);
        setError(null); // エラーをクリア
      } else {
        console.error("Error loading dashboard:", err);
        setError("データの読み込みに失敗しました");
        // エラー時はローカルストレージから読み込む（フォールバック）
        loadDataFromStorage();
      }
    } finally {
      setLoading(false);
    }
  }, [
    stampManagerContract,
    nftContract,
    account,
    isReady,
    loadDataFromStorage,
  ]);

  /**
   * 組織名を読み込む
   * accountが変更されたときに、organizationをリセットしてから再取得
   */
  useEffect(() => {
    if (isConnected && account && isReady) {
      // accountが変更されたときは、organizationをnullにリセットしてから再取得
      setOrganization(null);
      loadOrganization();
    } else if (!isConnected || !account) {
      setOrganization(null);
    }
  }, [isConnected, account, isReady, loadOrganization]);

  /**
   * ウォレット接続状態とコントラクト準備状態が変更されたときにデータを読み込む
   *
   * ウォレットが接続されていて、コントラクトが準備完了している場合、
   * ブロックチェーンからデータを読み込みます。
   * ウォレットが接続されていない場合は、ローカルストレージから読み込みます。
   * アカウントが変更された場合も、データを再読み込みします。
   */
  useEffect(() => {
    if (isConnected && isReady && account) {
      // ブロックチェーンから読み込む
      loadData();
    } else if (!isConnected) {
      // ウォレット未接続時はローカルストレージから読み込む（フォールバック）
      loadDataFromStorage();
    }
  }, [
    isConnected,
    isReady,
    account,
    loadData,
    loadDataFromStorage,
  ]);

  /**
   * ローディング表示
   *
   * データの読み込み中は、ローディングメッセージを表示します。
   */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  /**
   * エラー表示（データが存在しない場合）
   *
   * エラーが発生し、かつ統計情報がすべて 0 の場合は、
   * エラーメッセージと再読み込みボタンを表示します。
   */
  if (error && stats.totalStamps === 0 && stats.totalNFTs === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-semibold mb-2">エラー</div>
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            企業管理画面
          </h1>
          <p className="text-gray-600">スタンプ発行と統計管理</p>
        </div>
        <div className="flex space-x-4">
          <Link
            to="/org/stamp-issuance"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            🎫 スタンプを発行
          </Link>
          <Link
            to="/org/nft-applications"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            📝 NFT申請を確認
          </Link>
        </div>
      </div>

      {/* エラー警告（データが存在する場合） */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800 text-sm">
            ⚠️ {error}（ローカルストレージのデータを表示しています）
          </div>
        </div>
      )}

      {/* ダッシュボード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🎫</span>
            </div>
          </div>
          <div className="text-sm text-blue-100 mb-2">発行済みスタンプ</div>
          <div className="text-4xl font-bold">{stats.totalStamps} 枚</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">👥</span>
            </div>
          </div>
          <div className="text-sm text-green-100 mb-2">参加者数</div>
          <div className="text-4xl font-bold">{stats.totalUsers} 人</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🏆</span>
            </div>
          </div>
          <div className="text-sm text-purple-100 mb-2">NFT 発行数</div>
          <div className="text-4xl font-bold">{stats.totalNFTs} 枚</div>
        </div>
      </div>

      {/* 最近の発行 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">最近の発行</h2>
        </div>
        <div className="space-y-3">
          {recentStamps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg">
                まだスタンプを発行していません
              </p>
            </div>
          ) : (
            recentStamps.map((stamp) => {
              // スタンプの画像タイプとカテゴリに基づいて絵文字とグラデーションを取得
              const emoji = getStampEmoji(stamp.imageType, stamp.category);
              const gradient = getStampGradient(
                stamp.imageType,
                stamp.category
              );

              return (
                <div
                  key={stamp.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-md`}
                    >
                      <span className="text-2xl">{emoji}</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {stamp.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {stamp.organization}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {new Date(stamp.issuedAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
