import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";

/**
 * NFT証明書発行ページ（企業向け）
 *
 * ブロックチェーン経由でNFT証明書を発行する機能を提供します。
 * ユーザーが同一企業から3枚以上のスタンプを持っている場合、NFT証明書を発行できます。
 */
export default function OrgNFTIssuance() {
  const navigate = useNavigate();
  const { nftContract, stampManagerContract, isReady } = useContracts();
  const { isConnected, account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [stampCount, setStampCount] = useState(null);
  const [canMint, setCanMint] = useState(false);

  const [formData, setFormData] = useState({
    userAddress: "",
    nftName: "",
    rarity: "Common",
    tokenURI: "",
    organization: "企業A",
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
   * NFT証明書を発行
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
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
            hasPermission = await stampManagerContract.hasPlatformNFT(account);
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

      // トークンURIが空の場合はデフォルト値を設定
      const tokenURI =
        formData.tokenURI || `https://example.com/metadata/${Date.now()}.json`;

      // NFT証明書を発行（StampManager経由）
      // mintNFT(address to, string memory uri, string memory name, string memory rarity, string memory organization)
      const tx = await stampManagerContract.mintNFT(
        formData.userAddress,
        tokenURI,
        formData.nftName || `${formData.organization} 優秀な成績証明書`,
        formData.rarity,
        formData.organization
      );

      // トランザクションの確認を待つ
      await tx.wait();

      // 成功メッセージを表示
      setSuccess(true);
      // フォームをリセット
      setFormData({
        userAddress: "",
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

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              企業名 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            >
              <option value="企業A">企業A</option>
              <option value="企業B">企業B</option>
              <option value="企業C">企業C</option>
              <option value="企業D">企業D</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              スタンプを発行した企業名を選択してください
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
              <p className="text-sm mt-1">3秒後にダッシュボードに戻ります...</p>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isLoading || !isReady || !canMint || checking}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
            >
              {isLoading
                ? "⏳ 発行中..."
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
