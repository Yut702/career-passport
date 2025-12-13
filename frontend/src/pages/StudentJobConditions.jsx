import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { jobConditionAPI, zkpProofAPI } from "../lib/api";
import { jobCategories, industries } from "../data/jobCategories";
import { storage } from "../lib/storage";

// デフォルト条件
const getDefaultConditions = () => ({
  jobType: "",
  positionCategory: "",
  position: "",
  location: "",
  industry: "",
  salary: "",
  workStyle: "",
  skills: [],
  selectedZKPProofs: [], // 選択されたZKP証明のID配列
});

export default function StudentJobConditions() {
  const { account, isConnected } = useWallet();
  const [formData, setFormData] = useState(getDefaultConditions());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [availableZKPProofs, setAvailableZKPProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // 検証済みZKP証明を読み込む（データベースから）
  useEffect(() => {
    const loadZKPProofs = async () => {
      if (!isConnected || !account) {
        // ウォレット未接続時はローカルストレージから読み込む
        const proofs = storage.getZKPProofs();
        const verifiedProofs = proofs.filter(
          (p) => p.verifyResult?.verified === true
        );
        setAvailableZKPProofs(verifiedProofs);
        return;
      }

      try {
        // データベースから公開情報を取得
        const response = await zkpProofAPI.getZKPProofs(account);
        if (response.ok && response.proofs) {
          setAvailableZKPProofs(response.proofs);
        } else {
          // フォールバック: ローカルストレージから読み込む
          const proofs = storage.getZKPProofs();
          const verifiedProofs = proofs.filter(
            (p) => p.verifyResult?.verified === true
          );
          setAvailableZKPProofs(verifiedProofs);
        }
      } catch (err) {
        console.error("Error loading ZKP proofs:", err);
        // エラー時はローカルストレージから読み込む
        const proofs = storage.getZKPProofs();
        const verifiedProofs = proofs.filter(
          (p) => p.verifyResult?.verified === true
        );
        setAvailableZKPProofs(verifiedProofs);
      }
    };

    loadZKPProofs();
  }, [isConnected, account]);

  // データベースから求人条件を読み込む
  useEffect(() => {
    const loadConditions = async () => {
      if (!isConnected || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await jobConditionAPI.getJobCondition(account);
        if (response.ok && response.condition) {
          setFormData({
            ...response.condition,
            selectedZKPProofs: response.condition.selectedZKPProofs || [],
          });
          if (response.condition.positionCategory) {
            setSelectedCategory(
              jobCategories[response.condition.positionCategory] || null
            );
          }
        } else {
          // データベースにデータがない場合、ローカルストレージから読み込む（フォールバック）
          try {
            const saved = localStorage.getItem("studentJobConditions");
            if (saved) {
              const parsed = JSON.parse(saved);
              setFormData({
                ...parsed,
                selectedZKPProofs: parsed.selectedZKPProofs || [],
              });
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
        console.error("Error loading job conditions:", err);
        // エラー時はローカルストレージから読み込む（フォールバック）
        try {
          const saved = localStorage.getItem("studentJobConditions");
          if (saved) {
            const parsed = JSON.parse(saved);
            setFormData({
              ...parsed,
              selectedZKPProofs: parsed.selectedZKPProofs || [],
            });
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

  const handleZKPProofToggle = (proofId) => {
    setFormData({
      ...formData,
      selectedZKPProofs: formData.selectedZKPProofs.includes(proofId)
        ? formData.selectedZKPProofs.filter((id) => id !== proofId)
        : [...formData.selectedZKPProofs, proofId],
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
      const response = await jobConditionAPI.saveJobCondition(
        account,
        formData
      );

      if (response.ok) {
        // 成功時はローカルストレージにも保存（フォールバック用）
        localStorage.setItem("studentJobConditions", JSON.stringify(formData));
        // 成功メッセージを表示
        setSuccessMessage("保存されました");
        // 少し遅延してから仕事探し画面へ遷移
        setTimeout(() => {
          navigate("/student/job-search");
        }, 1500);
      } else {
        throw new Error(response.error || "保存に失敗しました");
      }
    } catch (err) {
      console.error("Error saving job conditions:", err);
      setError(err.message || "求人条件の保存に失敗しました");
      // エラー時もローカルストレージに保存（フォールバック）
      try {
        localStorage.setItem("studentJobConditions", JSON.stringify(formData));
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
            求人条件を保存するには、MetaMaskなどのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            仕事応募条件設定
          </h1>
          <p className="text-gray-600">希望する仕事の条件を設定してください</p>
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
            <select
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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

          {/* ZKP証明の選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔐 ZKP証明（検証済み）
              <span className="text-xs text-gray-500 ml-2">
                （任意）条件を満たすことを証明するために使用します
              </span>
            </label>
            {availableZKPProofs.length === 0 ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800 text-sm mb-2">
                  検証済みのZKP証明がありません。
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/student/settings?tab=zkp")}
                  className="text-yellow-700 underline hover:text-yellow-900 text-sm"
                >
                  VC管理ページで証明を生成する
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {availableZKPProofs.map((proof) => {
                  const proofTypes =
                    proof.usedVCs?.map((vc) => {
                      const names = {
                        myNumber: "マイナンバー",
                        toeic: "TOEIC",
                        degree: "学位",
                      };
                      return names[vc.type] || vc.type;
                    }) || [];
                  const proofId = proof.proofId || proof.id;
                  const isSelected =
                    formData.selectedZKPProofs.includes(proofId);

                  return (
                    <label
                      key={proofId}
                      className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleZKPProofToggle(proofId)}
                        className="mt-1 mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {proof.proofHash
                            ? `証明 ${proof.proofHash.slice(0, 16)}...`
                            : `証明 ${proofId}`}
                        </div>
                        <div className="text-xs text-gray-600">
                          {proofTypes.length > 0
                            ? `使用VC: ${proofTypes.join(", ")}`
                            : "VC情報なし"}
                        </div>
                        {(proof.verified ||
                          proof.verifyResult?.verified ||
                          proof.verifiedAt) && (
                          <div className="text-xs text-green-600 mt-1 font-medium">
                            ✅ 検証済み
                            {proof.verifiedAt && (
                              <span className="text-gray-500 ml-1">
                                (
                                {new Date(proof.verifiedAt).toLocaleDateString(
                                  "ja-JP"
                                )}
                                )
                              </span>
                            )}
                          </div>
                        )}
                        {/* 公開情報を表示 */}
                        {proof.publicInputs &&
                          Object.keys(proof.publicInputs).length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                              <div className="text-xs font-medium text-gray-600 mb-1">
                                公開情報:
                              </div>
                              <div className="text-xs text-gray-700 space-y-1">
                                {Object.entries(proof.publicInputs).map(
                                  ([key, value]) => (
                                    <div key={key}>
                                      <span className="font-medium">
                                        {key}:
                                      </span>{" "}
                                      {String(value)}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

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
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "条件を保存して探す"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
