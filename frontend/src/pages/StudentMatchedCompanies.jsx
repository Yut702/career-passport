import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function StudentMatchedCompanies() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // モックデータ（実際の実装ではAPIから取得）
    const mockCompanies = [
      {
        id: 1,
        name: "株式会社テック",
        industry: "IT・ソフトウェア",
        location: "東京都",
        matchScore: 95,
        description: "最先端の技術で社会に貢献する企業です。",
        benefits: ["リモートワーク可", "研修制度充実", "福利厚生充実"],
      },
      {
        id: 2,
        name: "株式会社イノベーション",
        industry: "IT・ソフトウェア",
        location: "東京都",
        matchScore: 88,
        description: "スタートアップ文化で成長できる環境です。",
        benefits: ["フレックスタイム", "勉強会支援", "最新設備"],
      },
      {
        id: 3,
        name: "株式会社スタートアップ",
        industry: "IT・ソフトウェア",
        location: "リモート可",
        matchScore: 82,
        description: "若手が活躍できるフラットな組織です。",
        benefits: ["完全リモート", "裁量労働", "スキルアップ支援"],
      },
    ];
    setCompanies(mockCompanies);
    setLoading(false);
  }, [jobId]);

  const handleContact = (companyId) => {
    navigate(`/student/messages?companyId=${companyId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
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
                <h3 className="font-bold text-indigo-900 mb-2 text-lg">プライバシー保護とZKP（ゼロ知識証明）</h3>
                <p className="text-sm text-indigo-800 mb-3">
                  <strong>ゼロ知識証明（ZKP）</strong>を使用することで、個人情報を開示せずに条件を満たすことを証明できます。
                  ローカルに保存された<strong>VC（Verifiable Credential：検証可能な証明書）</strong>に基づいて条件を証明します。
                </p>
                <div className="bg-white rounded-lg p-4 border border-indigo-200 mb-3">
                  <h4 className="font-bold text-indigo-900 mb-2 text-sm">✅ ZKPで証明可能なもの</h4>
                  <ul className="text-sm text-indigo-800 list-disc list-inside ml-2 space-y-1">
                    <li>ZKPは<strong>VC（ローカルに保存された証明書）</strong>に対して使用されます</li>
                    <li>例：VCに「TOEIC 850点」が含まれているが、「800点以上」という条件を満たすことを証明（実際のスコアは開示しない）</li>
                    <li>例：VCに「年齢26歳」が含まれているが、「25歳以上」という条件を満たすことを証明（実際の年齢は開示しない）</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-bold text-yellow-900 mb-2 text-sm">💡 重要</h4>
                  <ul className="text-sm text-yellow-800 list-disc list-inside ml-2 space-y-1">
                    <li>NFT証明書はブロックチェーン上に公開されているため、そのまま見せれば良いです（ZKP不要）</li>
                    <li>VCは信頼できる発行者（政府、大学、試験機関など）が発行した検証可能な証明書です</li>
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
              key={company.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {company.industry}
                  </p>
                  <p className="text-sm text-gray-500">{company.location}</p>
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

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  福利厚生
                </div>
                <div className="flex flex-wrap gap-2">
                  {company.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/student/settings?tab=zkp&companyId=${company.id}`)}
                  className="w-full border-2 border-indigo-600 text-indigo-600 text-center py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
                >
                  🔐 ZKPで条件を証明
                </button>
                <p className="text-xs text-gray-500 text-center">
                  個人情報を開示せずに条件を満たすことを証明
                </p>
                <button
                  onClick={() => handleContact(company.id)}
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

