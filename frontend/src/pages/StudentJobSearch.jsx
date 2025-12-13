import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { matchAPI, jobConditionAPI } from "../lib/api";
import { formatAddress } from "../lib/utils";
import { jobCategories, industries } from "../data/jobCategories";

export default function StudentJobSearch() {
  const { account, isConnected } = useWallet();
  const [myCondition, setMyCondition] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!isConnected || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 自分の求人条件を取得
        const conditionResponse = await jobConditionAPI.getJobCondition(
          account
        );
        if (conditionResponse.ok && conditionResponse.condition) {
          setMyCondition(conditionResponse.condition);
        }

        // マッチング候補を取得
        const matchResponse = await matchAPI.searchStudentMatches(account);
        if (matchResponse.ok && matchResponse.candidates) {
          // マッチング候補を求人情報に変換
          const formattedJobs = matchResponse.candidates.map((candidate) => {
            const condition = candidate.condition;
            const category = condition.positionCategory
              ? jobCategories[condition.positionCategory]
              : null;
            return {
              orgAddress: candidate.orgAddress,
              matchScore: candidate.matchScore,
              title: condition.position || category?.name || "募集職種",
              company: formatAddress(candidate.orgAddress),
              location: condition.location || "未設定",
              salary: condition.salary || "応相談",
              description: condition.description || "条件に合った企業です",
              workStyle: condition.workStyle || "未設定",
              industry: condition.industry || "未設定",
            };
          });
          setJobs(formattedJobs);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("データの取得に失敗しました");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isConnected, account]);

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
            マッチング候補を表示するには、MetaMaskなどのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">仕事探し</h1>
          <p className="text-gray-600">
            条件に合った仕事を探して応募しましょう
          </p>
        </div>
        <Link
          to="/student/job-conditions"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          条件を変更
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 自分の求人条件を表示 */}
      {myCondition && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            📋 あなたの求人条件
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">仕事の種類:</span>{" "}
              <span className="text-gray-900">
                {myCondition.jobType === "internship"
                  ? "インターンシップ"
                  : myCondition.jobType === "fulltime"
                  ? "正社員"
                  : "未設定"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">職種カテゴリ:</span>{" "}
              <span className="text-gray-900">
                {myCondition.positionCategory
                  ? jobCategories[myCondition.positionCategory]?.name ||
                    "未設定"
                  : "未設定"}
              </span>
            </div>
            {myCondition.position && (
              <div>
                <span className="font-semibold text-gray-700">
                  具体的な職種:
                </span>{" "}
                <span className="text-gray-900">{myCondition.position}</span>
              </div>
            )}
            {myCondition.location && (
              <div>
                <span className="font-semibold text-gray-700">勤務地:</span>{" "}
                <span className="text-gray-900">{myCondition.location}</span>
              </div>
            )}
            {myCondition.industry && (
              <div>
                <span className="font-semibold text-gray-700">業界:</span>{" "}
                <span className="text-gray-900">
                  {industries.find((i) => i.value === myCondition.industry)
                    ?.label || myCondition.industry}
                </span>
              </div>
            )}
            {myCondition.salary && (
              <div>
                <span className="font-semibold text-gray-700">希望給与:</span>{" "}
                <span className="text-gray-900">{myCondition.salary}</span>
              </div>
            )}
            {myCondition.workStyle && (
              <div>
                <span className="font-semibold text-gray-700">働き方:</span>{" "}
                <span className="text-gray-900">
                  {myCondition.workStyle === "remote"
                    ? "リモート"
                    : myCondition.workStyle === "hybrid"
                    ? "ハイブリッド"
                    : myCondition.workStyle === "office"
                    ? "オフィス"
                    : myCondition.workStyle}
                </span>
              </div>
            )}
            {myCondition.skills && myCondition.skills.length > 0 && (
              <div className="md:col-span-2">
                <span className="font-semibold text-gray-700">希望スキル:</span>{" "}
                <span className="text-gray-900">
                  {myCondition.skills.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {!myCondition && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800">
            ⚠️
            求人条件が設定されていません。条件を設定すると、マッチング候補が表示されます。
          </p>
          <Link
            to="/student/job-conditions"
            className="mt-2 inline-block text-yellow-700 underline hover:text-yellow-900"
          >
            条件を設定する
          </Link>
        </div>
      )}

      {/* マッチング候補の企業一覧 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎯 マッチング候補の企業 ({jobs.length}件)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job, index) => (
            <div
              key={job.orgAddress || index}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {job.title}
                  </h3>
                  <p className="text-gray-600 mb-1">{job.company}</p>
                  <p className="text-sm text-gray-500 mb-1">{job.location}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {job.orgAddress}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {job.matchScore}%
                  </div>
                  <div className="text-xs text-gray-500">マッチ度</div>
                </div>
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">
                {job.description}
              </p>

              <div className="flex items-center justify-between mb-4 text-sm">
                <div className="text-gray-600">
                  <span>給与: {job.salary}</span>
                </div>
                <div className="text-gray-600">
                  <span>働き方: {job.workStyle}</span>
                </div>
              </div>

              <Link
                to={`/student/matched-companies?orgAddress=${job.orgAddress}`}
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                詳細を見る
              </Link>
            </div>
          ))}
        </div>

        {jobs.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">
              条件に合った企業が見つかりませんでした
            </p>
            <Link
              to="/student/job-conditions"
              className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              条件を変更する
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
