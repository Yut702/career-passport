import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function StudentJobSearch() {
  const [jobType, setJobType] = useState("internship"); // "internship" or "fulltime"
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // モックデータ（実際の実装ではAPIから取得）
    const mockJobs = {
      internship: [
        {
          id: 1,
          title: "エンジニアインターンシップ",
          company: "株式会社テック",
          location: "東京都",
          duration: "3ヶ月",
          salary: "時給1,500円",
          description: "Webアプリケーション開発のインターンシップです。",
        },
        {
          id: 2,
          title: "マーケティングインターン",
          company: "株式会社マーケット",
          location: "リモート可",
          duration: "2ヶ月",
          salary: "時給1,200円",
          description: "デジタルマーケティングの実務経験が積めます。",
        },
      ],
      fulltime: [
        {
          id: 3,
          title: "フロントエンドエンジニア",
          company: "株式会社スタートアップ",
          location: "東京都",
          salary: "400万円〜",
          description: "React/Vue.jsを使った開発を行います。",
        },
        {
          id: 4,
          title: "バックエンドエンジニア",
          company: "株式会社クラウド",
          location: "リモート可",
          salary: "450万円〜",
          description: "Node.js/Pythonを使ったAPI開発を行います。",
        },
      ],
    };
    setJobs(mockJobs[jobType] || []);
    setLoading(false);
  }, [jobType]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {jobType === "internship" ? "インターン探し中" : "就職探し中"}
            </h1>
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

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setJobType("internship")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              jobType === "internship"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            インターンシップ
          </button>
          <button
            onClick={() => setJobType("fulltime")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              jobType === "fulltime"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            正社員
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {job.title}
                  </h3>
                  <p className="text-gray-600 mb-1">{job.company}</p>
                  <p className="text-sm text-gray-500">{job.location}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💼</span>
                </div>
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">
                {job.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  {job.duration && <span>期間: {job.duration}</span>}
                </div>
                <div className="text-sm font-medium text-blue-600">
                  {job.salary}
                </div>
              </div>

              <Link
                to={`/student/matched-companies?jobId=${job.id}`}
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                詳細を見る
              </Link>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">
              条件に合った仕事が見つかりませんでした
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
  );
}

