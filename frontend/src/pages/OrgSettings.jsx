import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWalletConnect } from "../hooks/useWalletConnect";
import {
  initializeMockVCForWallet,
  getOrgVCs,
  getOrganizationNameFromWallet,
} from "../lib/vc/org-vc-utils";

export default function OrgSettings() {
  const { account, isConnected } = useWalletConnect();
  const [searchParams] = useSearchParams();
  const isFirstTime = searchParams.get("firstTime") === "true";
  const navigate = useNavigate();

  // 保存されたVCを初期値として読み込む
  const [vcs, setVcs] = useState(() => {
    try {
      const savedVCs = localStorage.getItem("orgVCs");
      return savedVCs ? JSON.parse(savedVCs) : [];
    } catch (error) {
      console.error("Error loading VCs:", error);
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // ウォレットアドレスに基づいてモックVCを初期化
  useEffect(() => {
    if (isConnected && account) {
      const existingVCs = getOrgVCs();
      const hasVCForWallet = existingVCs.some(
        (vc) => vc.walletAddress === account.toLowerCase()
      );

      // まだVCが存在しない場合のみ初期化
      if (!hasVCForWallet) {
        const mockVC = initializeMockVCForWallet(account);
        if (mockVC) {
          // VCが初期化された場合は、状態を更新（次のレンダリングサイクルで）
          setTimeout(() => {
            setVcs(getOrgVCs());
            console.log(
              `モックVCを初期化しました: ${mockVC.attributes.companyName} (${account})`
            );
          }, 0);
        }
      }
    }
  }, [isConnected, account]);

  // モック：実際の実装では、法人登記証明書や税務署からの証明書などのVCを外部から取得
  // 注意：現時点では企業向けVC形式は実証実験レベル
  // 将来的には法務省や税務署からVCを取得できるようになる予定
  const handleAddVC = async (vcType) => {
    setLoading(true);

    // モック：実際の実装では、VC発行者（法務省、税務署、業界団体など）からVCを取得
    // 現時点では実証実験レベルで、一般的にはまだ利用できない
    setTimeout(() => {
      // ウォレットアドレスから企業名を取得（チェックリストのアドレスの場合）
      const orgNameFromWallet = account
        ? getOrganizationNameFromWallet(account)
        : null;

      // 企業名を決定（ウォレットアドレスから取得できた場合はそれを使用、そうでなければデフォルト）
      const companyName =
        orgNameFromWallet ||
        (vcType === "corporateRegistration"
          ? "株式会社テック"
          : vcType === "industryCertification"
          ? "IT企業認証"
          : null);

      const mockVC = {
        id: `vc_${Date.now()}`,
        type: vcType,
        issuer:
          vcType === "corporateRegistration"
            ? "法務省"
            : vcType === "taxCertificate"
            ? "税務署"
            : vcType === "industryCertification"
            ? "業界団体"
            : vcType === "isoCertification"
            ? "ISO認証機関"
            : "その他",
        issuedAt: new Date().toISOString(),
        attributes:
          vcType === "corporateRegistration"
            ? {
                companyName: companyName || "株式会社テック",
                registrationNumber: "1234567890123",
                establishmentDate: "2020-01-01",
                address: "東京都...",
              }
            : vcType === "taxCertificate"
            ? {
                taxId: "T1234567890123",
                fiscalYear: "2024",
                status: "正常",
              }
            : vcType === "industryCertification"
            ? {
                certificationName: companyName || "IT企業認証",
                certificationBody: "IT業界団体",
                validUntil: "2025-12-31",
              }
            : vcType === "isoCertification"
            ? {
                isoStandard: "ISO 27001",
                certificationBody: "ISO認証機関",
                validUntil: "2025-12-31",
              }
            : {
                type: "その他",
                description: "その他の企業証明書",
              },
        verified: true,
        walletAddress: account ? account.toLowerCase() : undefined, // ウォレットアドレスを記録
      };

      const updatedVCs = [...vcs, mockVC];
      setVcs(updatedVCs);
      localStorage.setItem("orgVCs", JSON.stringify(updatedVCs));
      setLoading(false);
    }, 1000);
  };

  const handleRemoveVC = (vcId) => {
    const updatedVCs = vcs.filter((vc) => vc.id !== vcId);
    setVcs(updatedVCs);
    localStorage.setItem("orgVCs", JSON.stringify(updatedVCs));
  };

  const getVCDisplayName = (type) => {
    const names = {
      corporateRegistration: "法人登記証明書",
      taxCertificate: "税務証明書",
      industryCertification: "業界認証",
      isoCertification: "ISO認証",
      other: "その他の証明書",
    };
    return names[type] || type;
  };

  const handleSkip = () => {
    // スキップして企業トップへ遷移
    navigate("/org");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center space-x-4 mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          企業VC管理
        </h1>
      </div>

      {/* 前提条件と現状 */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <span className="text-3xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 mb-2 text-lg">
              前提条件と現状
            </h3>
            <div className="space-y-2 text-sm text-yellow-800">
              <p>
                <strong>企業向けVC（Verifiable Credential）</strong>
                は、法人登記証明書、税務証明書、業界認証、ISO認証などの形式で発行される可能性があります。
              </p>
              <p>
                現時点では、これらのVC形式は<strong>実証実験レベル</strong>
                です。法務省や税務署、業界団体などがVC形式での証明書発行を本格化する予定ですが、まだ一般的には利用できません。
              </p>
              <p>
                現在の実装は、将来的なVC取得機能の<strong>モック</strong>
                として実装されています。実際のVC取得APIは未実装です。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Web3設計について */}
      <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <span className="text-3xl">🔐</span>
          <div className="flex-1">
            <h3 className="font-bold text-purple-900 mb-2 text-lg">
              Web3設計について
            </h3>
            <p className="text-sm text-purple-800 mb-3">
              このアプリケーションは<strong>Web3設計</strong>
              に基づいており、企業情報も
              <strong>VC（Verifiable Credential）</strong>ベースで管理されます。
            </p>
            <div className="bg-white rounded-lg p-4 border border-purple-200 mb-3">
              <h4 className="font-bold text-purple-900 mb-2 text-sm">
                ✅ VCベースの設計
              </h4>
              <ul className="text-sm text-purple-800 list-disc list-inside ml-2 space-y-1">
                <li>
                  企業情報は<strong>VC（Verifiable Credential）</strong>
                  として管理されます
                </li>
                <li>法人登記証明書、税務証明書などのVCを外部から取得・保存</li>
                <li>VCから必要な情報を選択的に開示可能</li>
                <li>ユーザーが自分で入力する情報は不要（VCベースの設計）</li>
                <li>
                  運営側のサーバーには<strong>一切送信されません</strong>
                </li>
                <li>ウォレットアドレスが企業の識別子として使用されます</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 font-semibold mb-1">
                💡 プライバシー保護
              </p>
              <p className="text-xs text-yellow-800">
                企業情報はVCとしてローカルストレージにのみ保存され、運営側は一切保持しません。
                これにより、企業が自分のデータを完全にコントロールできます。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VC取得セクション */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">VCの取得</h2>
        <p className="text-gray-600 mb-6">
          信頼できる発行者（法務省、税務署、業界団体など）からVCを取得できます。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              type: "corporateRegistration",
              label: "法人登記証明書",
              icon: "📋",
              issuer: "法務省",
            },
            {
              type: "taxCertificate",
              label: "税務証明書",
              icon: "💰",
              issuer: "税務署",
            },
            {
              type: "industryCertification",
              label: "業界認証",
              icon: "🏅",
              issuer: "業界団体",
            },
            {
              type: "isoCertification",
              label: "ISO認証",
              icon: "✅",
              issuer: "ISO認証機関",
            },
            {
              type: "other",
              label: "その他の証明書",
              icon: "📄",
              issuer: "その他",
            },
          ].map((vcType) => (
            <button
              key={vcType.type}
              onClick={() => handleAddVC(vcType.type)}
              disabled={loading}
              className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-4xl mb-3">{vcType.icon}</div>
              <div className="font-bold text-gray-900 mb-1">{vcType.label}</div>
              <div className="text-sm text-gray-600">
                発行者: {vcType.issuer}
              </div>
              {loading && (
                <div className="mt-2 text-xs text-purple-600">取得中...</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 所持VC一覧 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">所持VC一覧</h2>
        {vcs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 mb-2">まだVCが登録されていません</p>
            <p className="text-sm text-gray-500">
              上記の「VCの取得」からVCを追加してください
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vcs.map((vc) => (
              <div
                key={vc.id}
                className="p-6 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {getVCDisplayName(vc.type)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      発行者: {vc.issuer} | 発行日:{" "}
                      {new Date(vc.issuedAt).toLocaleDateString("ja-JP")}
                    </p>
                    {vc.verified && (
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        ✅ 検証済み
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveVC(vc.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    削除
                  </button>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    含まれる情報:
                  </div>
                  <div className="space-y-1">
                    {Object.entries(vc.attributes).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <span className="text-gray-600 font-medium w-32">
                          {key === "companyName"
                            ? "企業名"
                            : key === "registrationNumber"
                            ? "登記番号"
                            : key === "establishmentDate"
                            ? "設立日"
                            : key === "taxId"
                            ? "税務ID"
                            : key === "fiscalYear"
                            ? "年度"
                            : key === "certificationName"
                            ? "認証名"
                            : key === "isoStandard"
                            ? "ISO規格"
                            : key === "validUntil"
                            ? "有効期限"
                            : key}
                          :
                        </span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between pt-4">
        {isFirstTime && (
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-gray-600 rounded-xl font-medium hover:text-gray-800 transition-colors"
          >
            スキップして次へ →
          </button>
        )}
        <div className="flex space-x-4 ml-auto">
          {!isFirstTime && (
            <button
              onClick={() => navigate("/org")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
