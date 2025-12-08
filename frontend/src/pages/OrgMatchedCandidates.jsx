import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function OrgMatchedCandidates() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get("candidateId");
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // モックデータ（実際の実装ではAPIから取得）
    const mockCandidate = {
      id: parseInt(candidateId) || 1,
      name: "山田 太郎",
      university: "東京大学",
      major: "情報工学",
      graduationYear: "2026",
      skills: ["JavaScript", "React", "Node.js"],
      matchScore: 92,
      experience: [
        "Webアプリケーション開発のインターンシップ経験あり",
        "オープンソースプロジェクトへの貢献",
      ],
      nfts: [
        { id: 1, name: "フロントエンド開発認定", organization: "株式会社テック" },
        { id: 2, name: "React開発者認定", organization: "株式会社スタートアップ" },
      ],
    };
    setCandidate(mockCandidate);
    setLoading(false);
  }, [candidateId]);

  const handleContact = () => {
    navigate(`/org/messages?candidateId=${candidate?.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">人材情報が見つかりません</p>
      </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/org/candidate-search")}
          className="mb-6 text-purple-600 hover:text-purple-700 flex items-center space-x-2"
        >
          <span>←</span>
          <span>人材探しに戻る</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {candidate.name}
              </h1>
              <p className="text-gray-600 text-lg mb-1">
                {candidate.university} {candidate.major}
              </p>
              <p className="text-gray-500">
                {candidate.graduationYear}年卒業予定
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-600">
                {candidate.matchScore}%
              </div>
              <div className="text-sm text-gray-500">マッチ度</div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">スキル</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">経験</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {candidate.experience.map((exp, index) => (
                  <li key={index}>{exp}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                所持NFT証明書
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidate.nfts.map((nft) => (
                  <div
                    key={nft.id}
                    className="p-4 bg-purple-50 rounded-xl border border-purple-200"
                  >
                    <div className="font-medium text-gray-900">{nft.name}</div>
                    <div className="text-sm text-gray-600">
                      {nft.organization}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={() => navigate("/org/candidate-search")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleContact}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                メッセージを送る
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

