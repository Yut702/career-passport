import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { matchAPI } from "../lib/api";
import { formatAddress } from "../lib/utils";

export default function StudentMatchedCompanies() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const navigate = useNavigate();
  const { account, isConnected } = useWallet();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isConnected || !account) {
      setLoading(false);
      return;
    }

    const loadMatches = async () => {
      try {
        const response = await matchAPI.getStudentMatches(account);
        if (response.ok && response.matches) {
          // マッチング情報を企業情報に変換
          // 実際の実装では、企業の詳細情報を別途取得する必要があります
          const formattedCompanies = response.matches
            .filter((match) => match.status === "active")
            .map((match) => ({
              matchId: match.matchId,
              walletAddress: match.orgAddress,
              matchScore: 95, // 実際の実装では計算する
              description: "マッチング済みの企業です。",
              benefits: [],
              zkpProofHash: match.zkpProofHash,
              matchedAt: match.matchedAt,
            }));
          setCompanies(formattedCompanies);
        }
      } catch (err) {
        console.error("Error loading matches:", err);
        setError("マッチング情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [isConnected, account, jobId]);

  const handleContact = (walletAddress) => {
    navigate(`/student/messages?companyId=${walletAddress}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-yellow-800 font-semibold mb-2">
            ⚠️ ウォレットを接続してください
          </p>
          <p className="text-yellow-700 text-sm">
            マッチング情報を表示するには、MetaMaskなどのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-800 font-semibold mb-2">エラー</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate("/student/job-search")}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
        >
          <span>←</span>
          <span>仕事探しに戻る</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          条件マッチング企業
        </h1>
        <p className="text-gray-600 mb-4">
          あなたの条件に合った企業が見つかりました
        </p>
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">🔐</span>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 mb-2 text-lg">
                プライバシー保護とZKP（ゼロ知識証明）
              </h3>
              <p className="text-sm text-indigo-800 mb-3">
                <strong>ゼロ知識証明（ZKP）</strong>
                を使用することで、個人情報を開示せずに条件を満たすことを証明できます。
                ローカルに保存された
                <strong>VC（Verifiable Credential：検証可能な証明書）</strong>
                に基づいて条件を証明します。
              </p>
              <div className="bg-white rounded-lg p-4 border border-indigo-200 mb-3">
                <h4 className="font-bold text-indigo-900 mb-2 text-sm">
                  ✅ ZKPで証明可能なもの
                </h4>
                <ul className="text-sm text-indigo-800 list-disc list-inside ml-2 space-y-1">
                  <li>
                    ZKPは<strong>VC（ローカルに保存された証明書）</strong>
                    に対して使用されます
                  </li>
                  <li>
                    例：VCに「TOEIC
                    850点」が含まれているが、「800点以上」という条件を満たすことを証明（実際のスコアは開示しない）
                  </li>
                  <li>
                    例：VCに「年齢26歳」が含まれているが、「25歳以上」という条件を満たすことを証明（実際の年齢は開示しない）
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-2 text-sm">
                  💡 重要
                </h4>
                <ul className="text-sm text-yellow-800 list-disc list-inside ml-2 space-y-1">
                  <li>
                    NFT証明書はブロックチェーン上に公開されているため、そのまま見せれば良いです（ZKP不要）
                  </li>
                  <li>
                    VCは信頼できる発行者（政府、大学、試験機関など）が発行した検証可能な証明書です
                  </li>
                  <li>個人情報を開示せずに条件を満たすことを証明可能です</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div
            key={company.matchId}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {formatAddress(company.walletAddress)}
                </h3>
                <p className="text-sm text-gray-600 mb-1 font-mono">
                  {company.walletAddress}
                </p>
                {company.zkpProofHash && (
                  <p className="text-xs text-indigo-600 mt-1">🔐 ZKP証明済み</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {company.matchScore}%
                </div>
                <div className="text-xs text-gray-500">マッチ度</div>
              </div>
            </div>

            <p className="text-gray-700 mb-4 line-clamp-2">
              {company.description}
            </p>

            {company.matchedAt && (
              <div className="mb-4 text-xs text-gray-500">
                マッチング日時:{" "}
                {new Date(company.matchedAt).toLocaleString("ja-JP")}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() =>
                  navigate(
                    `/student/settings?tab=zkp&companyId=${company.walletAddress}`
                  )
                }
                className="w-full border-2 border-indigo-600 text-indigo-600 text-center py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
              >
                🔐 ZKPで条件を証明
              </button>
              <p className="text-xs text-gray-500 text-center">
                個人情報を開示せずに条件を満たすことを証明
              </p>
              <button
                onClick={() => handleContact(company.walletAddress)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                メッセージを送る
              </button>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">
            条件に合った企業が見つかりませんでした
          </p>
        </div>
      )}
    </div>
  );
}
