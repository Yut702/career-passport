import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { jobConditionAPI } from "../lib/api";
import { jobCategories, industries } from "../data/jobCategories";

// デフォルト条件
const getDefaultConditions = () => ({
  jobType: "",
  positionCategory: "",
  position: "",
  industry: "",
  requiredSkills: [],
  preferredSkills: [],
  location: "",
  workStyle: "",
  salary: "",
  description: "",
});

export default function OrgRecruitmentConditions() {
  const { account, isConnected } = useWallet();
  const [formData, setFormData] = useState(getDefaultConditions());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // データベースから採用条件を読み込む
  useEffect(() => {
    const loadConditions = async () => {
      if (!isConnected || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await jobConditionAPI.getRecruitmentCondition(account);
        if (response.ok && response.condition) {
          setFormData(response.condition);
          if (response.condition.positionCategory) {
            setSelectedCategory(
              jobCategories[response.condition.positionCategory] || null
            );
          }
        } else {
          // データベースにデータがない場合、ローカルストレージから読み込む（フォールバック）
          try {
            const saved = localStorage.getItem("orgRecruitmentConditions");
            if (saved) {
              const parsed = JSON.parse(saved);
              setFormData(parsed);
              if (parsed.positionCategory) {
                setSelectedCategory(
                  jobCategories[parsed.positionCategory] || null
                );
              }
            }
          } catch (err) {
            console.error("Failed to parse saved conditions:", err);
          }
        }
      } catch (err) {
        console.error("Error loading recruitment conditions:", err);
        // エラー時はローカルストレージから読み込む（フォールバック）
        try {
          const saved = localStorage.getItem("orgRecruitmentConditions");
          if (saved) {
            const parsed = JSON.parse(saved);
            setFormData(parsed);
            if (parsed.positionCategory) {
              setSelectedCategory(
                jobCategories[parsed.positionCategory] || null
              );
            }
          }
        } catch (parseErr) {
          console.error("Failed to parse saved conditions:", parseErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadConditions();
  }, [isConnected, account]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryChange = (categoryKey) => {
    const category = jobCategories[categoryKey];
    setSelectedCategory(category);
    setFormData({
      ...formData,
      positionCategory: categoryKey,
      position: "",
      requiredSkills: [],
      preferredSkills: [],
    });
  };

  const handleSkillToggle = (skill, type) => {
    setFormData({
      ...formData,
      [type]: formData[type].includes(skill)
        ? formData[type].filter((s) => s !== skill)
        : [...formData[type], skill],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected || !account) {
      setError("ウォレットを接続してください");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // データベースに保存
      const response = await jobConditionAPI.saveRecruitmentCondition(
        account,
        formData
      );

      if (response.ok) {
        // 成功時はローカルストレージにも保存（フォールバック用）
        localStorage.setItem(
          "orgRecruitmentConditions",
          JSON.stringify(formData)
        );
        // 成功メッセージを表示
        setSuccessMessage("保存されました");
        // 少し遅延してから人材探し画面へ遷移
        setTimeout(() => {
          navigate("/org/candidate-search");
        }, 1500);
      } else {
        throw new Error(response.error || "保存に失敗しました");
      }
    } catch (err) {
      console.error("Error saving recruitment conditions:", err);
      setError(err.message || "採用条件の保存に失敗しました");
      // エラー時もローカルストレージに保存（フォールバック）
      try {
        localStorage.setItem(
          "orgRecruitmentConditions",
          JSON.stringify(formData)
        );
      } catch (storageErr) {
        console.error("Failed to save to localStorage:", storageErr);
      }
    } finally {
      setSaving(false);
    }
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
            採用条件を保存するには、MetaMaskなどのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            人材募集条件設定
          </h1>
          <p className="text-gray-600">募集する人材の条件を設定してください</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <p className="text-green-800 font-semibold">✅ {successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              募集タイプ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="jobType"
                  value="internship"
                  checked={formData.jobType === "internship"}
                  onChange={handleChange}
                  className="mr-3"
                  required
                />
                <div>
                  <div className="font-medium">インターンシップ</div>
                  <div className="text-sm text-gray-500">短期間の実務経験</div>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="jobType"
                  value="event"
                  checked={formData.jobType === "event"}
                  onChange={handleChange}
                  className="mr-3"
                  required
                />
                <div>
                  <div className="font-medium">イベント</div>
                  <div className="text-sm text-gray-500">イベント参加</div>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="jobType"
                  value="lecture"
                  checked={formData.jobType === "lecture"}
                  onChange={handleChange}
                  className="mr-3"
                  required
                />
                <div>
                  <div className="font-medium">講座</div>
                  <div className="text-sm text-gray-500">
                    学習・研修プログラム
                  </div>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="jobType"
                  value="fulltime"
                  checked={formData.jobType === "fulltime"}
                  onChange={handleChange}
                  className="mr-3"
                  required
                />
                <div>
                  <div className="font-medium">正社員</div>
                  <div className="text-sm text-gray-500">長期雇用</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              職種カテゴリ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {Object.entries(jobCategories).map(([key, category]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    formData.positionCategory === key
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-2xl mb-1">{category.icon}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {category.name}
                  </div>
                </button>
              ))}
            </div>
            {selectedCategory && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  具体的な職種 <span className="text-red-500">*</span>
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="">選択してください</option>
                  {selectedCategory.positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              業界
            </label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">選択してください</option>
              {industries.map((industry) => (
                <option key={industry.value} value={industry.value}>
                  {industry.label}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory && selectedCategory.skills.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  必須スキル
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill, "requiredSkills")}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        formData.requiredSkills.includes(skill)
                          ? "bg-purple-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  歓迎スキル
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() =>
                        handleSkillToggle(skill, "preferredSkills")
                      }
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        formData.preferredSkills.includes(skill)
                          ? "bg-pink-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              勤務地
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="例: 東京都、リモート可"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              勤務形態
            </label>
            <div className="grid grid-cols-3 gap-4">
              {["remote", "hybrid", "office"].map((style) => (
                <label
                  key={style}
                  className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="workStyle"
                    value={style}
                    checked={formData.workStyle === style}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div>
                    {style === "remote" && "リモート"}
                    {style === "hybrid" && "ハイブリッド"}
                    {style === "office" && "オフィス"}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              給与
            </label>
            <select
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">選択してください（任意）</option>
              <option value="200万円未満">200万円未満</option>
              <option value="200万円〜300万円">200万円〜300万円</option>
              <option value="300万円〜400万円">300万円〜400万円</option>
              <option value="400万円〜500万円">400万円〜500万円</option>
              <option value="500万円〜600万円">500万円〜600万円</option>
              <option value="600万円〜700万円">600万円〜700万円</option>
              <option value="700万円〜800万円">700万円〜800万円</option>
              <option value="800万円〜1000万円">800万円〜1000万円</option>
              <option value="1000万円以上">1000万円以上</option>
              <option value="応相談">応相談</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              募集内容の詳細
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="募集内容の詳細を記入してください"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/org")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "条件を保存して探す"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
