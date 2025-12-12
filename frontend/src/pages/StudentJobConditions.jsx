import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jobCategories, industries } from "../data/jobCategories";

// 初期条件を読み込む関数
const loadInitialConditions = () => {
  try {
    const saved = localStorage.getItem("studentJobConditions");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to parse saved conditions:", error);
  }
  return {
    jobType: "",
    positionCategory: "",
    position: "",
    location: "",
    industry: "",
    salary: "",
    workStyle: "",
    skills: [],
  };
};

// 初期カテゴリを読み込む関数
const loadInitialCategory = (positionCategory) => {
  if (positionCategory && jobCategories[positionCategory]) {
    return jobCategories[positionCategory];
  }
  return null;
};

export default function StudentJobConditions() {
  const initialData = loadInitialConditions();
  const [formData, setFormData] = useState(initialData);
  const [selectedCategory, setSelectedCategory] = useState(
    loadInitialCategory(initialData.positionCategory)
  );
  const navigate = useNavigate();

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
      skills: [],
    });
  };

  const handleSkillToggle = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.includes(skill)
        ? formData.skills.filter((s) => s !== skill)
        : [...formData.skills, skill],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 条件を保存
    localStorage.setItem("studentJobConditions", JSON.stringify(formData));
    // 仕事探し画面へ遷移
    navigate("/student/job-search");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            仕事応募条件設定
          </h1>
          <p className="text-gray-600">希望する仕事の条件を設定してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              仕事の種類 <span className="text-red-500">*</span>
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
              勤務地
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="例: 東京都、リモート可"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              希望職種カテゴリ
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {Object.entries(jobCategories).map(([key, category]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    formData.positionCategory === key
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
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
                  具体的な職種
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">選択してください（任意）</option>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">選択してください</option>
              {industries.map((industry) => (
                <option key={industry.value} value={industry.value}>
                  {industry.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              希望給与
            </label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="例: 300万円〜"
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

          {selectedCategory && selectedCategory.skills.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                希望スキル
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory.skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      formData.skills.includes(skill)
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/student")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              条件を保存して探す
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
