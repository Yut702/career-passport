import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import { useWalletConnect } from "../hooks/useWalletConnect";
import {
  getVerifiedOrganizationNameForWalletAsync,
  getVCVerificationStatusForWallet,
} from "../lib/vc/org-vc-utils";
import { nftApplicationAPI } from "../lib/api";

/**
 * NFT証明書発行ページ（企業向け）
 *
 * ブロックチェーン経由でNFT証明書を発行する機能を提供します。
 * ユーザーが同一企業から3枚以上のスタンプを持っている場合、NFT証明書を発行できます。
 */
export default function OrgNFTIssuance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nftContract, stampManagerContract, isReady } = useContracts();
  const { isConnected, account } = useWalletConnect();
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [stampCount, setStampCount] = useState(null);
  const [canMint, setCanMint] = useState(false);
  const [applicationId, setApplicationId] = useState(null); // 申請IDを保持

  // 申請情報から初期値を設定（申請から遷移した場合）
  const application = location.state?.application;

  // 接続中のウォレットアドレスから企業名を取得（初期値）
  // データベースから取得するため、非同期で初期化
  const [initialOrgName, setInitialOrgName] = useState(
    application?.organization || "企業A"
  );

  const [formData, setFormData] = useState({
    userAddress: application?.userAddress || "",
    userAddresses: "", // 複数アドレス用（改行区切り）
    nftName: "",
    rarity: "Common",
    tokenURI: "",
    organization: initialOrgName,
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

  // 申請情報がある場合、フォームを自動入力
  useEffect(() => {
    if (application) {
      setApplicationId(application.applicationId);
      setFormData((prev) => ({
        ...prev,
        userAddress: application.userAddress,
        organization: application.organization,
      }));
      // スタンプ数をチェック
      if (stampManagerContract && application.userAddress && isReady) {
        // 少し待ってからチェック（フォームが更新されるまで）
        setTimeout(() => {
          checkUserStamps();
        }, 100);
      }
    }
  }, [application, stampManagerContract, isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isBulkMode, setIsBulkMode] = useState(false); // 一括送信モード
  const [bulkProgress, setBulkProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    current: "",
    errors: [], // エラー詳細
    checked: [], // スタンプ数チェック済みアドレス
  });

  /**
   * ユーザーのスタンプ数をチェック
   * ユーザーアドレスと企業名を元にAnvilブロックチェーンからスタンプ数を確認
   */
  const checkUserStamps = async () => {
    // コントラクトが準備できていない場合はスキップ
    if (!isReady || !stampManagerContract) {
      setStampCount(null);
      setCanMint(false);
      setError(
        "コントラクトが読み込まれていません。しばらく待ってから再度お試しください。"
      );
      return;
    }

    // ユーザーアドレスまたは企業名が入力されていない場合はスキップ
    if (!formData.userAddress || !formData.organization) {
      setStampCount(null);
      setCanMint(false);
      setError(null);
      return;
    }

    setChecking(true);
    setError(null);

    try {
      // ウォレットアドレスの形式チェック
      if (
        !formData.userAddress.startsWith("0x") ||
        formData.userAddress.length !== 42
      ) {
        setError(
          "有効なウォレットアドレスを入力してください（0xで始まる42文字）"
        );
        setStampCount(null);
        setCanMint(false);
        return;
      }

      console.log("🔍 スタンプ数を確認中...", {
        userAddress: formData.userAddress,
        organization: formData.organization,
        contractAddress: stampManagerContract.target,
      });

      // コントラクトアドレスの存在確認
      const contractCode = await stampManagerContract.runner.provider.getCode(
        stampManagerContract.target
      );
      if (contractCode === "0x" || contractCode === "0x0") {
        throw new Error(
          `コントラクトが存在しません。アドレス: ${stampManagerContract.target}。Anvilが起動しているか、コントラクトがデプロイされているか確認してください。`
        );
      }

      // ブロックチェーン（Anvil）から組織別スタンプ数を取得
      const count = await stampManagerContract.getOrganizationStampCount(
        formData.userAddress,
        formData.organization
      );

      // ブロックチェーン（Anvil）からNFT発行可能かチェック（3枚以上か）
      const canMintNft = await stampManagerContract.canMintNft(
        formData.userAddress,
        formData.organization
      );

      const stampCountNum = Number(count);
      console.log("✅ スタンプ数確認完了", {
        count: stampCountNum,
        canMint: canMintNft,
        organization: formData.organization,
      });

      setStampCount(stampCountNum);
      setCanMint(canMintNft);

      // 3枚未満の場合はエラーメッセージを表示（ただし、これはエラーではなく情報）
      if (!canMintNft) {
        setError(
          `${formData.organization}からのスタンプが${stampCountNum}枚です。3枚以上必要です。`
        );
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("❌ スタンプ数確認エラー:", err);
      console.error("エラー詳細:", {
        message: err.message,
        reason: err.reason,
        code: err.code,
        data: err.data,
      });

      // より詳細なエラーメッセージを表示
      let errorMessage = "スタンプ数の確認に失敗しました";

      if (err.message) {
        // コントラクトが存在しない場合
        if (
          err.message.includes("コントラクトが存在しません") ||
          err.message.includes("contract does not exist")
        ) {
          errorMessage = err.message;
        }
        // BAD_DATAエラー（コントラクトが存在しない、またはメソッドが見つからない）
        else if (
          err.message.includes("could not decode result data") ||
          err.message.includes("BAD_DATA") ||
          err.code === "BAD_DATA"
        ) {
          errorMessage = `コントラクトエラー: StampManagerコントラクトが見つかりません。
            
考えられる原因:
1. Anvilが起動していない → ターミナルで "anvil" を実行してください
2. コントラクトがデプロイされていない → コントラクトをデプロイしてください
3. コントラクトアドレスが間違っている → 環境変数 VITE_STAMP_MANAGER_ADDRESS を確認してください

現在のコントラクトアドレス: ${stampManagerContract?.target || "不明"}`;
        }
        // ネットワークエラー
        else if (
          err.message.includes("network") ||
          err.message.includes("Network") ||
          err.code === "NETWORK_ERROR"
        ) {
          errorMessage =
            "ネットワークエラー: Anvilブロックチェーンに接続できません。Anvilが起動しているか確認してください。";
        }
        // その他のエラー
        else {
          errorMessage = `スタンプ数の確認に失敗しました: ${err.message}`;
        }
      } else if (err.reason) {
        errorMessage = `スタンプ数の確認に失敗しました: ${err.reason}`;
      } else if (err.code === "BAD_DATA") {
        errorMessage = `コントラクトエラー: コントラクトが存在しないか、メソッドが見つかりません。コントラクトアドレスとABIを確認してください。`;
      }

      setError(errorMessage);
      setStampCount(null);
      setCanMint(false);
    } finally {
      setChecking(false);
    }
  };

  /**
   * ユーザーアドレスまたは企業名が変更されたときにスタンプ数をチェック
   * コントラクトが準備できている場合のみ実行
   */
  useEffect(() => {
    // コントラクトが準備できていない場合はスキップ
    if (!isReady || !stampManagerContract) {
      setStampCount(null);
      setCanMint(false);
      return;
    }

    // デバウンス処理（500ms待ってからチェック）
    const timer = setTimeout(() => {
      if (
        formData.userAddress &&
        formData.organization &&
        stampManagerContract
      ) {
        checkUserStamps();
      } else {
        setStampCount(null);
        setCanMint(false);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.userAddress,
    formData.organization,
    stampManagerContract,
    isReady,
  ]);

  /**
   * 単一アドレスにNFTを発行
   */
  const mintNFTToAddress = async (address) => {
    // アドレスの形式をチェック
    if (!address.startsWith("0x") || address.length !== 42) {
      throw new Error(`無効なアドレス: ${address}`);
    }

    // スタンプ数をチェック
    const count = await stampManagerContract.getOrganizationStampCount(
      address,
      formData.organization
    );
    const canMintNft = await stampManagerContract.canMintNft(
      address,
      formData.organization
    );

    if (!canMintNft) {
      throw new Error(
        `スタンプ数が不足しています（現在: ${Number(count)}枚、必要: 3枚以上）`
      );
    }

    // 注意: 現在のmintNft関数はimageTypeパラメータを受け取らないため、
    // コントラクト側でレアリティベース（10, 20, 30, 40）で自動決定される
    // 将来的にスタンプのカテゴリベース（1-13）を反映するには、コントラクト側の修正が必要

    // トークンURIが空の場合はデフォルト値を設定
    const tokenURI =
      formData.tokenURI || `https://example.com/metadata/${Date.now()}.json`;

    // NFT証明書を発行（imageTypeは0の場合はレアリティベースで自動決定）
    // 注意: 現在のmintNft関数はimageTypeパラメータを受け取らないため、
    // コントラクト側で0を渡してレアリティベースで決定される
    const tx = await stampManagerContract.mintNft(
      address,
      tokenURI,
      formData.nftName || `${formData.organization} 優秀な成績証明書`,
      formData.rarity,
      formData.organization
    );

    // トランザクションの確認を待つ
    await tx.wait();
  };

  /**
   * 複数アドレスに一括でNFTを発行
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
    if (!isReady || !nftContract || !stampManagerContract) {
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
        `NFT証明書を発行する権限がありません。\nプラットフォーム参加企業NFTを所有している必要があります。`
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
      checked: [],
    });

    // 各アドレスに対して順次発行
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      setBulkProgress((prev) => ({
        ...prev,
        current: address,
      }));

      try {
        // スタンプ数をチェック
        const count = await stampManagerContract.getOrganizationStampCount(
          address,
          formData.organization
        );
        const canMintNft = await stampManagerContract.canMintNft(
          address,
          formData.organization
        );

        setBulkProgress((prev) => ({
          ...prev,
          checked: [
            ...prev.checked,
            { address, count: Number(count), canMint: canMintNft },
          ],
        }));

        if (!canMintNft) {
          throw new Error(
            `スタンプ数が不足しています（現在: ${Number(
              count
            )}枚、必要: 3枚以上）`
          );
        }

        await mintNFTToAddress(address);
        setBulkProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      } catch (err) {
        console.error(`Error minting NFT to ${address}:`, err);
        const errorMsg = err.reason || err.message || "不明なエラー";
        setBulkProgress((prev) => ({
          ...prev,
          failed: prev.failed + 1,
          errors: [...prev.errors, { address, error: errorMsg }],
        }));
      }

      // 次のトランザクションの前に少し待機
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
   * NFT証明書を発行
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
    if (!isReady || !nftContract || !stampManagerContract) {
      setError("コントラクトが読み込まれていません");
      return;
    }

    // スタンプ数チェック
    if (!canMint) {
      setError(
        "このユーザーはNFT証明書を発行する条件を満たしていません（3枚以上のスタンプが必要）"
      );
      return;
    }

    setIsLoading(true);

    try {
      // 発行権限を確認（所有者または参加企業NFT所有者）
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
          `NFT証明書を発行する権限がありません。\nプラットフォーム参加企業NFTを所有している必要があります。`
        );
        setIsLoading(false);
        return;
      }

      // NFT証明書を発行
      await mintNFTToAddress(formData.userAddress);

      // 申請IDがある場合、申請ステータスを「issued」に更新
      if (applicationId) {
        try {
          await nftApplicationAPI.updateStatus(applicationId, "issued");
        } catch (updateError) {
          console.error("Error updating application status:", updateError);
          // ステータス更新に失敗しても発行は成功しているので続行
        }
      }

      // 成功メッセージを表示
      setSuccess(true);

      // 申請から遷移した場合は申請一覧に戻る、直接アクセスの場合はダッシュボードに戻る
      if (applicationId) {
        // フォームをリセット（申請情報は保持しない）
        setFormData({
          userAddress: "",
          userAddresses: "",
          nftName: "",
          rarity: "Common",
          tokenURI: "",
          organization: initialOrgName,
        });
        setStampCount(null);
        setCanMint(false);
        setApplicationId(null);

        // 3秒後に申請一覧に戻る
        setTimeout(() => {
          navigate("/org/nft-applications");
        }, 3000);
      } else {
        // フォームをリセット
        setFormData({
          userAddress: "",
          userAddresses: "",
          nftName: "",
          rarity: "Common",
          tokenURI: "",
          organization: "企業A",
        });
        setStampCount(null);
        setCanMint(false);

        // 3秒後にダッシュボードに戻る
        setTimeout(() => {
          navigate("/org");
        }, 3000);
      }
    } catch (error) {
      console.error("Error minting NFT:", error);

      let errorMessage = "NFT証明書の発行に失敗しました";
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
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
            NFT証明書を発行するには、MetaMask
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
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🏆</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              NFT証明書を発行
            </h1>
            <p className="text-gray-600 mt-1">
              ブロックチェーン経由でNFT証明書を作成します
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
                setStampCount(null);
                setCanMint(false);
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
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
                <br />
                各アドレスのスタンプ数が3枚以上の場合のみNFTを発行します
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
                  {bulkProgress.checked.length > 0 && (
                    <div className="mt-2 text-xs">
                      <p className="font-semibold text-blue-700 mb-1">
                        スタンプ数チェック結果:
                      </p>
                      {bulkProgress.checked.map((item, idx) => (
                        <p
                          key={idx}
                          className={`font-mono ${
                            item.canMint ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {item.address}: {item.count}枚{" "}
                          {item.canMint ? "✓" : "✗"}
                        </p>
                      ))}
                    </div>
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
                NFT証明書を受け取るユーザーのウォレットアドレスを入力してください
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              企業名 <span className="text-red-500">*</span>
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
            <p className="text-xs text-gray-500 mt-1">
              スタンプを発行した企業名を入力してください
            </p>
          </div>

          {/* スタンプ数チェック結果 */}
          {checking && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl">
              <p className="text-sm">スタンプ数を確認中...</p>
            </div>
          )}

          {stampCount !== null && !checking && (
            <div
              className={`p-4 border-2 rounded-xl ${
                canMint
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
              }`}
            >
              <p className="font-semibold mb-1">
                {formData.organization}からのスタンプ数: {stampCount}枚
              </p>
              {canMint ? (
                <p className="text-sm">
                  ✅ NFT証明書を発行する条件を満たしています（3枚以上）
                </p>
              ) : (
                <p className="text-sm">
                  ⚠️ NFT証明書を発行するには、あと{3 - stampCount}
                  枚のスタンプが必要です
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              NFT証明書の名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nftName}
              onChange={(e) =>
                setFormData({ ...formData, nftName: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="例: 優秀な成績証明書、インターンシップ修了証"
            />
            <p className="text-xs text-gray-500 mt-1">
              この名前がNFT証明書のタイトルとして表示されます
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              レアリティ
            </label>
            <select
              value={formData.rarity}
              onChange={(e) =>
                setFormData({ ...formData, rarity: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            >
              <option value="Common">Common（普通）</option>
              <option value="Rare">Rare（レア）</option>
              <option value="Epic">Epic（エピック）</option>
              <option value="Legendary">Legendary（レジェンダリー）</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              NFT証明書のレアリティを選択してください
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              メタデータURI（オプション）
            </label>
            <input
              type="text"
              value={formData.tokenURI}
              onChange={(e) =>
                setFormData({ ...formData, tokenURI: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
              placeholder="https://example.com/metadata.json または IPFS URI"
            />
            <p className="text-xs text-gray-500 mt-1">
              空欄の場合は自動生成されます。IPFS URIやHTTP URLを指定できます
            </p>
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
                ✅ NFT証明書が正常に発行されました！
              </p>
              {isBulkMode && bulkProgress.total > 0 && (
                <p className="text-sm mt-1">
                  成功: {bulkProgress.completed}件 / 失敗: {bulkProgress.failed}
                  件
                </p>
              )}
              <p className="text-sm mt-1">3秒後にダッシュボードに戻ります...</p>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={
                isLoading || !isReady || (!isBulkMode && (!canMint || checking))
              }
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
            >
              {isLoading
                ? isBulkMode
                  ? `⏳ 一括発行中... (${bulkProgress.completed}/${bulkProgress.total})`
                  : "⏳ 発行中..."
                : isBulkMode
                ? "🏆 一括でNFT証明書を発行"
                : canMint
                ? "🏆 NFT証明書を発行"
                : "❌ 発行条件未達成"}
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
