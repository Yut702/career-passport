import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OrgRecruitmentConditions() {
  const [formData, setFormData] = useState({
    jobType: "", // "internship" or "fulltime"
    position: "",
    requiredSkills: [],
    preferredSkills: [],
    location: "",
    workStyle: "", // "remote", "hybrid", "office"
    salary: "",
    description: "",
  });
  const [availableSkills] = useState([
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "AWS",
    "Docker",
    "TypeScript",
    "Vue.js",
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    // 保存された条件を読み込む
    const saved = localStorage.getItem("orgRecruitmentConditions");
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // 条件を保存
    localStorage.setItem(
      "orgRecruitmentConditions",
      JSON.stringify(formData)
    );
    // 人材探し画面へ遷移
    navigate("/org/candidate-search");
  };

  return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              人材募集条件設定
            </h1>
            <p className="text-gray-600">
              募集する人材の条件を設定してください
            </p>
          </div>

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
                職種 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="例: フロントエンドエンジニア"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                必須スキル
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => (
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
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill, "preferredSkills")}
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
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="例: 300万円〜"
              />
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
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                条件を保存して探す
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

