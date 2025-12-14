import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { matchAPI, jobConditionAPI } from "../lib/api";
import { formatAddress } from "../lib/utils";
import { jobCategories, industries } from "../data/jobCategories";

export default function OrgCandidateSearch() {
  const { account, isConnected } = useWallet();
  const [myCondition, setMyCondition] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [matchedStudents, setMatchedStudents] = useState([]);
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

        // 自分の採用条件を取得
        const conditionResponse = await jobConditionAPI.getRecruitmentCondition(
          account
        );
        if (conditionResponse.ok && conditionResponse.condition) {
          setMyCondition(conditionResponse.condition);
        }

        // マッチング検索APIを使用して候補者を取得
        const matchResponse = await matchAPI.searchOrgMatches(account);
        if (matchResponse.ok && matchResponse.candidates) {
          // マッチング候補を候補者情報に変換
          const formattedCandidates = matchResponse.candidates.map(
            (candidate) => ({
              studentAddress: candidate.studentAddress,
              condition: candidate.condition,
              matchScore: candidate.matchScore,
              name: formatAddress(candidate.studentAddress),
            })
          );
          setCandidates(formattedCandidates);
        } else {
          setCandidates([]);
        }

        // 成立したマッチング一覧を取得
        const matchesResponse = await matchAPI.getOrgMatches(account);
        if (matchesResponse.ok && matchesResponse.matches) {
          const activeMatches = matchesResponse.matches.filter(
            (m) => m.status === "active"
          );
          setMatchedStudents(activeMatches);
        } else {
          setMatchedStudents([]);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("データの取得に失敗しました");
        setCandidates([]);
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
            候補者情報を表示するには、MetaMaskなどのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            人材探し画面
          </h1>
          <p className="text-gray-600">
            条件に合った人材を探してマッチングしましょう
          </p>
        </div>
        <Link
          to="/org/recruitment-conditions"
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

      {/* 自分の採用条件を表示 */}
      {myCondition && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">
            📋 あなたの採用条件
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">仕事の種類:</span>{" "}
              <span className="text-gray-900">
                {myCondition.jobType === "internship"
                  ? "インターンシップ"
                  : myCondition.jobType === "event"
                  ? "イベント"
                  : myCondition.jobType === "lecture"
                  ? "講座"
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
                <span className="font-semibold text-gray-700">給与:</span>{" "}
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
            {myCondition.requiredSkills &&
              myCondition.requiredSkills.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">
                    必須スキル:
                  </span>{" "}
                  <span className="text-gray-900">
                    {myCondition.requiredSkills.join(", ")}
                  </span>
                </div>
              )}
            {myCondition.preferredSkills &&
              myCondition.preferredSkills.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">
                    希望スキル:
                  </span>{" "}
                  <span className="text-gray-900">
                    {myCondition.preferredSkills.join(", ")}
                  </span>
                </div>
              )}
            {myCondition.description && (
              <div className="md:col-span-2">
                <span className="font-semibold text-gray-700">説明:</span>{" "}
                <span className="text-gray-900">{myCondition.description}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!myCondition && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800">
            ⚠️
            採用条件が設定されていません。条件を設定すると、マッチング候補が表示されます。
          </p>
          <Link
            to="/org/recruitment-conditions"
            className="mt-2 inline-block text-yellow-700 underline hover:text-yellow-900"
          >
            条件を設定する
          </Link>
        </div>
      )}

      {/* 成立したマッチング一覧 */}
      {matchedStudents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ✅ 成立したマッチング ({matchedStudents.length}件)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {matchedStudents.map((match, index) => (
              <div
                key={match.matchId || index}
                className="bg-green-50 border-2 border-green-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {formatAddress(match.studentAddress)}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1 font-mono">
                      {match.studentAddress}
                    </p>
                    {match.matchedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        マッチング日:{" "}
                        {new Date(match.matchedAt).toLocaleDateString("ja-JP")}
                      </p>
                    )}
                    {match.zkpProofHash && (
                      <p className="text-xs text-indigo-600 mt-1">
                        🔐 ZKP証明済み
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">✅</div>
                    <div className="text-xs text-gray-500">成立</div>
                  </div>
                </div>

                <Link
                  to={`/org/matched-candidates?studentAddress=${match.studentAddress}&matchId=${match.matchId}`}
                  className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  詳細を見る
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* マッチング候補の学生一覧 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎯 マッチング候補の学生 ({candidates.length}件)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate, index) => (
            <div
              key={candidate.studentAddress || index}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {candidate.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1 font-mono">
                    {candidate.studentAddress}
                  </p>
                  {candidate.condition?.positionCategory && (
                    <p className="text-xs text-indigo-600 mt-1">
                      📋 {candidate.condition.positionCategory}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {candidate.matchScore}%
                  </div>
                  <div className="text-xs text-gray-500">マッチ度</div>
                </div>
              </div>

              {candidate.condition && (
                <div className="mb-4 text-xs text-gray-500 space-y-1">
                  {candidate.condition.location && (
                    <div>勤務地: {candidate.condition.location}</div>
                  )}
                  {candidate.condition.workStyle && (
                    <div>働き方: {candidate.condition.workStyle}</div>
                  )}
                  {candidate.condition.salary && (
                    <div>希望給与: {candidate.condition.salary}</div>
                  )}
                </div>
              )}

              <Link
                to={`/org/matched-candidates?studentAddress=${candidate.studentAddress}`}
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                詳細を見る
              </Link>
            </div>
          ))}
        </div>

        {candidates.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">
              条件に合った人材が見つかりませんでした
            </p>
            <Link
              to="/org/recruitment-conditions"
              className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              条件を変更する
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
