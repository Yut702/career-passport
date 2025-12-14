import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useContracts } from "../hooks/useContracts";
import { useWalletConnect } from "../hooks/useWalletConnect";
import { storage } from "../lib/storage";
import {
  getVerifiedOrganizationNameForWalletAsync,
  getVCVerificationStatusForWallet,
} from "../lib/vc/org-vc-utils";

/**
 * スタンプ発行ページ（企業向け）
 *
 * ブロックチェーン経由でスタンプを発行する機能を提供します。
 * ウォレット接続が必要で、StampManager コントラクトを使用してスタンプを発行します。
 */
export default function OrgStampIssuance() {
  const navigate = useNavigate();
  const { stampManagerContract, isReady } = useContracts();
  const { isConnected, account, provider } = useWalletConnect();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 接続中のウォレットアドレスから企業名を取得（初期値）
  // データベースから取得するため、非同期で初期化
  const [initialOrgName, setInitialOrgName] = useState("企業A");

  const [formData, setFormData] = useState({
    userAddress: "",
    userAddresses: "", // 複数アドレス用（改行区切り）
    stampName: "",
    organization: initialOrgName,
    category: "finance",
  });

  // ウォレット接続時にデータベースから企業名を取得
  useEffect(() => {
    const loadCompanyName = async () => {
      if (account) {
        const companyName = await getVerifiedOrganizationNameForWalletAsync(
          account
        );
        if (companyName) {
          setInitialOrgName(companyName);
          setFormData((prev) => ({
            ...prev,
            organization: companyName,
          }));
        }
      }
    };
    loadCompanyName();
  }, [account]);

  const [vcStatus, setVcStatus] = useState(
    account
      ? getVCVerificationStatusForWallet(account)
      : {
          hasVCs: false,
          hasVerifiedVCs: false,
          hasCorporateVC: false,
          organizationName: null,
        }
  );

  // ウォレットアドレスとVCの状態を監視して、企業名を更新
  useEffect(() => {
    if (!account) {
      // ウォレットが接続されていない場合はデフォルト値にリセット
      setFormData((prev) => ({
        ...prev,
        organization: "企業A",
      }));
      setVcStatus({
        hasVCs: false,
        hasVerifiedVCs: false,
        hasCorporateVC: false,
        organizationName: null,
      });
      return;
    }

    const checkVCStatus = async () => {
      const newStatus = getVCVerificationStatusForWallet(account);
      setVcStatus(newStatus);

      // データベースから企業名を取得（優先）
      const dbCompanyName = await getVerifiedOrganizationNameForWalletAsync(
        account
      );
      const companyName = dbCompanyName || newStatus.organizationName;

      if (companyName && companyName !== formData.organization) {
        setFormData((prev) => ({
          ...prev,
          organization: companyName,
        }));
      } else if (!companyName && formData.organization !== "企業A") {
        // 企業名が見つからない場合はデフォルト値にリセット
        setFormData((prev) => ({
          ...prev,
          organization: "企業A",
        }));
      }
    };

    // 初回チェック
    checkVCStatus();

    // 定期的にチェック（VCが外部で変更される可能性があるため）
    const interval = setInterval(checkVCStatus, 2000);

    return () => clearInterval(interval);
  }, [account, formData.organization]);
  const [isBulkMode, setIsBulkMode] = useState(false); // 一括送信モード
  const [bulkProgress, setBulkProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    current: "",
    errors: [], // エラー詳細
  });

  /**
   * 単一アドレスにスタンプを発行
   */
  const issueStampToAddress = async (address) => {
    // アドレスの形式をチェック
    if (!ethers.isAddress(address)) {
      throw new Error(`無効なアドレス: ${address}`);
    }

    // トランザクションを送信（画像タイプは0で自動決定）
    const tx = await stampManagerContract.issueStamp(
      address,
      formData.stampName,
      formData.organization,
      formData.category,
      1, // 発行数量（通常は1）
      0 // 画像タイプ（0の場合はカテゴリに基づいて自動決定）
    );

    // トランザクションの確認を待つ
    const receipt = await tx.wait();

    // ローカルストレージにスタンプを保存
    try {
      const newStamp = {
        name: formData.stampName,
        organization: formData.organization,
        category: formData.category,
        issuedAt: new Date().toISOString().split("T")[0],
        userAddress: address.toLowerCase(),
        contractAddress: stampManagerContract.target,
        transactionHash: receipt.hash,
      };
      storage.addStamp(newStamp);
      console.log("スタンプをローカルストレージに保存しました:", newStamp);
    } catch (storageError) {
      console.warn("ローカルストレージへの保存に失敗しました:", storageError);
    }

    return receipt;
  };

  /**
   * 複数アドレスに一括でスタンプを発行
   */
  const handleBulkSubmit = async () => {
    setError(null);
    setSuccess(false);

    // ウォレット接続チェック
    if (!isConnected) {
      setError("ウォレットが接続されていません");
      return;
    }

    // コントラクト読み込みチェック
    if (!isReady || !stampManagerContract) {
      setError("コントラクトが読み込まれていません");
      return;
    }

    // アドレスリストを取得（改行区切り）
    const addresses = formData.userAddresses
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (addresses.length === 0) {
      setError("少なくとも1つのアドレスを入力してください");
      return;
    }

    // 発行権限を確認
    let contractOwner;
    let hasPermission = false;

    try {
      contractOwner = await stampManagerContract.owner();
      if (contractOwner.toLowerCase() === account.toLowerCase()) {
        hasPermission = true;
      } else {
        try {
          hasPermission = await stampManagerContract.hasPlatformNft(account);
        } catch (platformNFTError) {
          console.warn("Error checking platform NFT:", platformNFTError);
          hasPermission = true;
        }
      }
    } catch (ownerError) {
      console.error("Error calling owner():", ownerError);
      hasPermission = true;
    }

    if (!hasPermission) {
      setError(
        `スタンプを発行する権限がありません。\nプラットフォーム参加企業NFTを所有している必要があります。`
      );
      return;
    }

    setIsLoading(true);
    setBulkProgress({
      total: addresses.length,
      completed: 0,
      failed: 0,
      current: "",
      errors: [],
    });

    // 各アドレスに対して順次発行
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      setBulkProgress((prev) => ({
        ...prev,
        current: address,
      }));

      try {
        await issueStampToAddress(address);
        setBulkProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      } catch (err) {
        console.error(`Error issuing stamp to ${address}:`, err);
        const errorMsg = err.reason || err.message || "不明なエラー";
        setBulkProgress((prev) => ({
          ...prev,
          failed: prev.failed + 1,
          errors: [...prev.errors, { address, error: errorMsg }],
        }));
      }

      // 次のトランザクションの前に少し待機（レート制限を避けるため）
      if (i < addresses.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setIsLoading(false);
    setSuccess(true);

    // 3秒後にダッシュボードに戻る
    setTimeout(() => {
      navigate("/org");
    }, 3000);
  };

  /**
   * フォーム送信ハンドラー
   *
   * ブロックチェーン経由でスタンプを発行します。
   * トランザクションの確認を待ち、成功したらフォームをリセットします。
   *
   * @param {Event} e - フォーム送信イベント
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // 一括送信モードの場合
    if (isBulkMode) {
      await handleBulkSubmit();
      return;
    }

    // ウォレット接続チェック
    if (!isConnected) {
      setError("ウォレットが接続されていません");
      return;
    }

    // コントラクト読み込みチェック
    if (!isReady || !stampManagerContract) {
      setError("コントラクトが読み込まれていません");
      return;
    }

    setIsLoading(true);

    try {
      // 1. コントラクトが存在するか確認（エラーが発生しても続行）
      if (provider && stampManagerContract?.target) {
        try {
          // ブロック番号を指定せずにgetCodeを呼び出す（デフォルトで最新のブロックを使用）
          // Anvilではブロック番号の問題を回避するため、エラーが発生しても続行
          const contractCode = await provider.getCode(
            stampManagerContract.target
          );
          if (contractCode === "0x" || contractCode === "0x0") {
            setError(
              `コントラクトが指定されたアドレスに存在しません。\nアドレス: ${stampManagerContract.target}\nコントラクトを再デプロイしてください。`
            );
            setIsLoading(false);
            return;
          }
        } catch (codeError) {
          // getCodeのエラーは無視して続行（ブロック番号の問題や、コントラクトが存在しない可能性があるが、owner()の呼び出しで確認できる）
          console.warn(
            "getCode error (ignored, will check with owner()):",
            codeError
          );
        }
      }

      // 2. 発行権限を確認（所有者または参加企業NFT所有者）
      // PoCのため、すべてのアドレスが参加企業NFTを持っているとみなす（モック実装）
      let contractOwner;
      let hasPermission = false;

      try {
        contractOwner = await stampManagerContract.owner();
        if (contractOwner.toLowerCase() === account.toLowerCase()) {
          // 所有者の場合は発行可能
          hasPermission = true;
        } else {
          // 参加企業NFTを所有しているかチェック（PoC: モックで常にtrue）
          try {
            hasPermission = await stampManagerContract.hasPlatformNft(account);
          } catch (platformNFTError) {
            console.warn("Error checking platform NFT:", platformNFTError);
            // PoCのため、エラーが発生しても発行可能とする（モック実装）
            hasPermission = true;
          }
        }
      } catch (ownerError) {
        console.error("Error calling owner():", ownerError);
        // PoCのため、エラーが発生しても発行可能とする（モック実装）
        hasPermission = true;
      }

      if (!hasPermission) {
        setError(
          `スタンプを発行する権限がありません。\nプラットフォーム参加企業NFTを所有している必要があります。`
        );
        setIsLoading(false);
        return;
      }

      // 3. ユーザーアドレスの形式をチェック
      if (!ethers.isAddress(formData.userAddress)) {
        setError(
          "無効なユーザーアドレスです。正しいアドレス形式を入力してください。"
        );
        setIsLoading(false);
        return;
      }

      // 4. トランザクションの見積もりを事前に行う（エラーを早期検出）
      try {
        await stampManagerContract.issueStamp.estimateGas(
          formData.userAddress,
          formData.stampName,
          formData.organization,
          formData.category,
          1, // 発行数量（通常は1）
          0 // 画像タイプ（0の場合はカテゴリに基づいて自動決定）
        );
      } catch (estimateError) {
        console.error("Gas estimation error:", estimateError);
        let estimateErrorMessage = "トランザクションの見積もりに失敗しました";
        if (estimateError.reason) {
          estimateErrorMessage = `見積もりエラー: ${estimateError.reason}`;
        } else if (estimateError.message) {
          estimateErrorMessage = `見積もりエラー: ${estimateError.message}`;
        }
        setError(estimateErrorMessage);
        setIsLoading(false);
        return;
      }

      // 5. トランザクションを送信
      await issueStampToAddress(formData.userAddress);

      // 成功メッセージを表示
      setSuccess(true);
      // フォームをリセット
      setFormData({
        userAddress: "",
        userAddresses: "",
        stampName: "",
        organization: "企業A",
        category: "finance",
      });

      // 3秒後にダッシュボードに戻る
      setTimeout(() => {
        navigate("/org");
      }, 3000);
    } catch (error) {
      console.error("Error issuing stamp:", error);

      // エラーメッセージを設定
      let errorMessage = "スタンプ発行に失敗しました";
      if (error.reason) {
        // コントラクトから返されたエラーメッセージ
        errorMessage = error.reason;
      } else if (error.message) {
        // その他のエラーメッセージ
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ウォレットが接続されていない場合の表示
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold text-lg">
            ウォレットを接続してください
          </p>
          <p className="text-red-500 mt-2">
            スタンプを発行するには、MetaMask
            などのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/org"
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span>ダッシュボードに戻る</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🎫</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">スタンプを発行</h1>
            <p className="text-gray-600 mt-1">
              ブロックチェーン経由で新しいスタンプを作成します
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 一括送信モード切り替え */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                送信モード
              </label>
              <p className="text-xs text-gray-500">
                {isBulkMode
                  ? "複数のアドレスにまとめて送信"
                  : "単一アドレスに送信"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setFormData({
                  ...formData,
                  userAddress: "",
                  userAddresses: "",
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {isBulkMode ? "単一送信に切り替え" : "一括送信に切り替え"}
            </button>
          </div>

          {isBulkMode ? (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                ユーザーアドレス（複数） <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.userAddresses}
                onChange={(e) =>
                  setFormData({ ...formData, userAddresses: e.target.value })
                }
                className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm h-40"
                placeholder="0x1234...&#10;0x5678...&#10;0x9abc..."
              />
              <p className="text-xs text-gray-500 mt-1">
                1行に1つのアドレスを入力してください（改行区切り）
              </p>
              {bulkProgress.total > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-700">
                      進捗: {bulkProgress.completed} / {bulkProgress.total}
                    </span>
                    <span className="text-sm text-blue-600">
                      {bulkProgress.failed > 0 && (
                        <span className="text-red-600">
                          失敗: {bulkProgress.failed}
                        </span>
                      )}
                    </span>
                  </div>
                  {bulkProgress.current && (
                    <p className="text-xs text-blue-600 font-mono truncate">
                      処理中: {bulkProgress.current}
                    </p>
                  )}
                  {bulkProgress.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      <p className="font-semibold">エラー詳細:</p>
                      {bulkProgress.errors.map((err, idx) => (
                        <p key={idx} className="font-mono">
                          {err.address}: {err.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                ユーザーアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.userAddress}
                onChange={(e) =>
                  setFormData({ ...formData, userAddress: e.target.value })
                }
                className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                placeholder="0x..."
              />
              <p className="text-xs text-gray-500 mt-1">
                スタンプを受け取るユーザーのウォレットアドレスを入力してください
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              スタンプ名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.stampName}
              onChange={(e) =>
                setFormData({ ...formData, stampName: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="例: 投資分析セミナー"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              企業名
            </label>

            {/* VC検証状態の表示 */}
            {vcStatus.hasVerifiedVCs && vcStatus.organizationName ? (
              <div className="mb-3 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm font-semibold text-green-800">
                    VCから取得した企業名
                  </span>
                </div>
                <p className="text-sm text-green-700">
                  {vcStatus.organizationName}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  VC（検証可能な証明書）から自動取得されました。手動で変更することもできます。
                </p>
              </div>
            ) : vcStatus.hasVCs && !vcStatus.hasVerifiedVCs ? (
              <div className="mb-3 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-yellow-600">⚠️</span>
                  <span className="text-sm font-semibold text-yellow-800">
                    VCが検証されていません
                  </span>
                </div>
                <p className="text-xs text-yellow-700">
                  VCは登録されていますが、検証されていません。企業設定ページでVCを確認してください。
                </p>
              </div>
            ) : (
              <div className="mb-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-600">💡</span>
                  <span className="text-sm font-semibold text-blue-800">
                    VC設定がモックのため、プラットフォームに企業名登録した前提で表示させています。
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  現在はモック実装のため、プラットフォームに登録された企業名を表示しています。将来的にはVC（法人登記証明書など）から自動取得される予定です。
                </p>
              </div>
            )}

            <input
              type="text"
              required
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              placeholder="企業名を入力"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              カテゴリ
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            >
              <option value="finance">金融 💰</option>
              <option value="marketing">マーケティング 📊</option>
              <option value="business">ビジネス 💼</option>
              <option value="programming">プログラミング 💻</option>
              <option value="design">デザイン 🎨</option>
              <option value="sales">営業・セールス 📞</option>
              <option value="consulting">コンサルティング 💡</option>
              <option value="hr">人事・採用 👥</option>
              <option value="accounting">経理・財務 📈</option>
              <option value="legal">法務 ⚖️</option>
              <option value="engineering">エンジニア・技術系 🔧</option>
              <option value="research">研究・開発 🔬</option>
              <option value="education">教育・研修 📚</option>
            </select>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl">
              <p className="font-semibold">エラー</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl">
              <p className="font-semibold">
                ✅ スタンプが正常に発行されました！
              </p>
              <p className="text-sm mt-1">3秒後にダッシュボードに戻ります...</p>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isLoading || !isReady}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
            >
              {isLoading
                ? isBulkMode
                  ? `⏳ 一括発行中... (${bulkProgress.completed}/${bulkProgress.total})`
                  : "⏳ 発行中..."
                : isBulkMode
                ? "🎫 一括でスタンプを発行"
                : "🎫 スタンプを発行"}
            </button>
            <Link
              to="/org"
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition text-center border-2 border-gray-200"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
