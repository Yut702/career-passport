import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWalletConnect } from "../hooks/useWalletConnect";
import { jobConditionAPI } from "../lib/api";
import { jobCategories, industries } from "../data/jobCategories";

export default function StudentMatchedCompanies() {
  const [searchParams] = useSearchParams();
  const orgAddress = searchParams.get("orgAddress");
  const navigate = useNavigate();
  const { isConnected } = useWalletConnect();
  const [companyCondition, setCompanyCondition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCompanyCondition = async () => {
      if (!orgAddress) {
        setError("企業アドレスが指定されていません");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 企業の採用条件を取得
        const response = await jobConditionAPI.getRecruitmentCondition(
          orgAddress
        );
        if (response.ok && response.condition) {
          setCompanyCondition(response.condition);
        } else {
          setError("企業の採用条件が見つかりませんでした");
        }
      } catch (err) {
        console.error("Error loading company condition:", err);
        setError("企業情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadCompanyCondition();
  }, [orgAddress]);

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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">企業詳細</h1>
        <p className="text-gray-600 mb-4">企業の採用条件を確認できます</p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {companyCondition && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📋 企業の採用条件
            </h2>
            <p className="text-sm text-gray-600 font-mono mb-4">{orgAddress}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <span className="font-semibold text-gray-700">仕事の種類:</span>{" "}
              <span className="text-gray-900">
                {companyCondition.jobType === "internship"
                  ? "インターンシップ"
                  : companyCondition.jobType === "event"
                  ? "イベント"
                  : companyCondition.jobType === "lecture"
                  ? "講座"
                  : companyCondition.jobType === "fulltime"
                  ? "正社員"
                  : "未設定"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">職種カテゴリ:</span>{" "}
              <span className="text-gray-900">
                {companyCondition.positionCategory
                  ? jobCategories[companyCondition.positionCategory]?.name ||
                    "未設定"
                  : "未設定"}
              </span>
            </div>
            {companyCondition.position && (
              <div>
                <span className="font-semibold text-gray-700">
                  具体的な職種:
                </span>{" "}
                <span className="text-gray-900">
                  {companyCondition.position}
                </span>
              </div>
            )}
            {companyCondition.location && (
              <div>
                <span className="font-semibold text-gray-700">勤務地:</span>{" "}
                <span className="text-gray-900">
                  {companyCondition.location}
                </span>
              </div>
            )}
            {companyCondition.industry && (
              <div>
                <span className="font-semibold text-gray-700">業界:</span>{" "}
                <span className="text-gray-900">
                  {industries.find((i) => i.value === companyCondition.industry)
                    ?.label || companyCondition.industry}
                </span>
              </div>
            )}
            {companyCondition.salary && (
              <div>
                <span className="font-semibold text-gray-700">給与:</span>{" "}
                <span className="text-gray-900">{companyCondition.salary}</span>
              </div>
            )}
            {companyCondition.workStyle && (
              <div>
                <span className="font-semibold text-gray-700">働き方:</span>{" "}
                <span className="text-gray-900">
                  {companyCondition.workStyle === "remote"
                    ? "リモート"
                    : companyCondition.workStyle === "hybrid"
                    ? "ハイブリッド"
                    : companyCondition.workStyle === "office"
                    ? "オフィス"
                    : companyCondition.workStyle}
                </span>
              </div>
            )}
            {companyCondition.requiredSkills &&
              companyCondition.requiredSkills.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">
                    必須スキル:
                  </span>{" "}
                  <span className="text-gray-900">
                    {companyCondition.requiredSkills.join(", ")}
                  </span>
                </div>
              )}
            {companyCondition.preferredSkills &&
              companyCondition.preferredSkills.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">
                    希望スキル:
                  </span>{" "}
                  <span className="text-gray-900">
                    {companyCondition.preferredSkills.join(", ")}
                  </span>
                </div>
              )}
            {companyCondition.description && (
              <div className="md:col-span-2">
                <span className="font-semibold text-gray-700">説明:</span>
                <p className="text-gray-900 mt-2 whitespace-pre-wrap">
                  {companyCondition.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!companyCondition && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">
            企業情報が見つかりませんでした
          </p>
        </div>
      )}
    </div>
  );
}
