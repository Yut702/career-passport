import { useState } from "react";
import { Link } from "react-router-dom";

export default function OrgCandidateSearch() {
  // モックデータ（実際の実装ではAPIから取得）
  const [candidates] = useState([
    {
      id: 1,
      name: "山田 太郎",
      university: "東京大学",
      major: "情報工学",
      graduationYear: "2026",
      skills: ["JavaScript", "React", "Node.js"],
      matchScore: 92,
    },
    {
      id: 2,
      name: "佐藤 花子",
      university: "早稲田大学",
      major: "情報科学",
      graduationYear: "2025",
      skills: ["Python", "AWS", "Docker"],
      matchScore: 88,
    },
    {
      id: 3,
      name: "鈴木 一郎",
      university: "慶應義塾大学",
      major: "情報工学",
      graduationYear: "2026",
      skills: ["TypeScript", "Vue.js", "React"],
      matchScore: 85,
    },
  ]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {candidate.name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {candidate.university}
                </p>
                <p className="text-sm text-gray-500">
                  {candidate.major} / {candidate.graduationYear}年卒
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {candidate.matchScore}%
                </div>
                <div className="text-xs text-gray-500">マッチ度</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                スキル
              </div>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <Link
              to={`/org/matched-candidates?candidateId=${candidate.id}`}
              className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              詳細を見る
            </Link>
          </div>
        ))}
      </div>

      {candidates.length === 0 && (
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
  );
}
