import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VCAndZKP() {
  const [activeTab, setActiveTab] = useState("vc"); // "vc" or "zkp"
  const [vcs, setVcs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [proofStatus, setProofStatus] = useState("idle");
  const [proofData, setProofData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 保存されたVCを読み込む
    const savedVCs = localStorage.getItem("studentVCs");
    if (savedVCs) {
      setVcs(JSON.parse(savedVCs));
    }
  }, []);

  // モック：実際の実装では、マイナンバーカードや学位証明書などのVCを外部から取得
  // 注意：現時点ではマイナンバーカードや学位証明書のVC形式は実証実験レベル
  // 将来的には政府や大学からVCを取得できるようになる予定
  const handleAddVC = async (vcType) => {
    setLoading(true);
    
    // モック：実際の実装では、VC発行者（政府、大学など）からVCを取得
    // 例：マイナンバーカードAPI、大学の学位証明書APIなど
    // 現時点では実証実験レベルで、一般的にはまだ利用できない
    setTimeout(() => {
      const mockVC = {
        id: `vc_${Date.now()}`,
        type: vcType,
        issuer: vcType === "myNumber" ? "政府" : vcType === "degree" ? "大学" : "試験機関",
        issuedAt: new Date().toISOString(),
        attributes: vcType === "myNumber" 
          ? {
              name: "山田 太郎",
              dateOfBirth: "1999-01-01",
              address: "東京都...",
              myNumber: "hidden", // 実際のマイナンバーは開示しない
            }
          : vcType === "degree"
          ? {
              university: "東京大学",
              major: "情報工学",
              degree: "学士",
              graduationYear: "2025",
            }
          : vcType === "toiec"
          ? {
              score: 850,
              testDate: "2024-01-15",
            }
          : {
              type: "その他",
              description: "その他の証明書",
            },
        verified: true,
      };
      
      const updatedVCs = [...vcs, mockVC];
      setVcs(updatedVCs);
      localStorage.setItem("studentVCs", JSON.stringify(updatedVCs));
      setLoading(false);
    }, 1000);
  };

  const handleRemoveVC = (vcId) => {
    const updatedVCs = vcs.filter((vc) => vc.id !== vcId);
    setVcs(updatedVCs);
    localStorage.setItem("studentVCs", JSON.stringify(updatedVCs));
  };

  const getVCDisplayName = (type) => {
    const names = {
      myNumber: "マイナンバーカード",
      degree: "学位証明書",
      toiec: "TOEIC証明書",
      other: "その他の証明書",
    };
    return names[type] || type;
  };

  const handleGenerateProof = async () => {
    setProofStatus("generating");
    // モック: ゼロ知識証明の生成（仕様に基づいた構造）
    setTimeout(() => {
      const timestamp = new Date().toISOString();
      setProofData({
        proof: {
          type: "BbsBlsSignatureProof2020",
          created: timestamp,
          proofPurpose: "assertionMethod",
          proofValue: "z5F8k" + Math.random().toString(16).substr(2, 60) + "...",
          verificationMethod: "did:web:gov.example:my-number#key-1",
          revealedAttributes: ["age", "toeic"],
          nonce: Math.random().toString(16).substr(2, 32),
        },
        publicInputs: {
          age: 26,
          ageCondition: ">= 25",
          toeic: 850,
          toeicCondition: ">= 800",
        },
        hiddenAttributes: {
          dateOfBirth: "hidden",
          nationality: "hidden",
          exactScore: "hidden",
          testCenter: "hidden",
        },
        satisfiedConditions: [
          {
            type: "age",
            condition: ">= 25",
            satisfied: true,
          },
          {
            type: "toeic",
            condition: ">= 800",
            satisfied: true,
          },
        ],
        timestamp: timestamp,
      });
      setProofStatus("success");
    }, 2000);
  };

  const handleVerifyProof = async () => {
    if (!proofData) return;
    setProofStatus("generating");
    // モック: 証明の検証（仕様に基づいた構造）
    setTimeout(() => {
      const verifyResult = {
        verified: true,
        conditions: proofData.satisfiedConditions || [],
        timestamp: proofData.timestamp,
      };
      setProofData({
        ...proofData,
        verifyResult: verifyResult,
      });
      setProofStatus("success");
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-3xl">🔐</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">VC管理とゼロ知識証明</h1>
          <p className="text-gray-600 mt-1">将来用の機能（実証実験レベル）</p>
        </div>
      </div>

      {/* 前提条件の警告 */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 mb-2 text-lg">前提条件と現状について</h3>
            <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1 ml-2">
              <li>マイナンバーカードや学位証明書のVC形式は<strong>実証実験レベル</strong>です（デジタル庁や一部大学で実証実験中）</li>
              <li>現時点では一般的には利用できません</li>
              <li>この実装は<strong>将来的なVC取得機能とZKP機能のモック</strong>です</li>
              <li>実際のVC取得APIとZKP実装は未実装です（将来的に実装予定）</li>
              <li>VCは信頼できる発行者（政府、大学、試験機関など）が発行した検証可能な証明書です</li>
              <li>ユーザーが自分で入力した情報はVCではありません</li>
            </ul>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("vc")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "vc"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          VC管理
        </button>
        <button
          onClick={() => setActiveTab("zkp")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "zkp"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ゼロ知識証明
        </button>
      </div>

      {/* VC管理タブ */}
      {activeTab === "vc" && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">VC（検証可能な証明書）管理</h2>
              <p className="text-gray-600 mb-4">
                信頼できる発行者が発行したVCを管理し、ZKPで選択的に開示できます
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🔐</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 mb-1">VC（Verifiable Credential）とは</h3>
                    <p className="text-sm text-blue-800 mb-2">
                      VCは信頼できる発行者（政府、大学、試験機関など）が発行した検証可能な証明書です。
                      マイナンバーカードや学位証明書などのVCから、必要な情報を選択的に開示できます。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* VC追加セクション */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">VCを追加</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleAddVC("myNumber")}
                  disabled={loading}
                  className="p-6 border-2 border-blue-300 rounded-xl hover:bg-blue-50 transition-colors text-left disabled:opacity-50 relative"
                >
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                      実証実験中
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">🆔</span>
                    <div>
                      <div className="font-bold text-gray-900">マイナンバーカード</div>
                      <div className="text-sm text-gray-600">政府が発行（実証実験レベル）</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    名前、生年月日、住所などの情報を含む（VC形式は実証実験中）
                  </p>
                </button>

                <button
                  onClick={() => handleAddVC("degree")}
                  disabled={loading}
                  className="p-6 border-2 border-blue-300 rounded-xl hover:bg-blue-50 transition-colors text-left disabled:opacity-50 relative"
                >
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                      実証実験中
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <div className="font-bold text-gray-900">学位証明書</div>
                      <div className="text-sm text-gray-600">大学が発行（一部大学で実証実験中）</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    大学名、専攻、学位、卒業年などの情報を含む（VC形式は一部大学で実証実験中）
                  </p>
                </button>

                <button
                  onClick={() => handleAddVC("toiec")}
                  disabled={loading}
                  className="p-6 border-2 border-blue-300 rounded-xl hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">📝</span>
                    <div>
                      <div className="font-bold text-gray-900">TOEIC証明書</div>
                      <div className="text-sm text-gray-600">試験機関が発行</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    スコア、受験日などの情報を含む
                  </p>
                </button>

                <button
                  onClick={() => handleAddVC("other")}
                  disabled={loading}
                  className="p-6 border-2 border-blue-300 rounded-xl hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">📄</span>
                    <div>
                      <div className="font-bold text-gray-900">その他の証明書</div>
                      <div className="text-sm text-gray-600">各種機関が発行</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    資格証明書、インターンシップ証明など
                  </p>
                </button>
              </div>
              {loading && (
                <div className="mt-4 text-center text-gray-600">
                  VCを取得中...
                </div>
              )}
            </div>

            {/* VC一覧 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">保存されたVC</h3>
              {vcs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 text-lg mb-2">
                    まだVCが登録されていません
                  </p>
                  <p className="text-sm text-gray-400">
                    上記のボタンからVCを追加してください
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vcs.map((vc) => (
                    <div
                      key={vc.id}
                      className="p-6 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">
                            {getVCDisplayName(vc.type)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            発行者: {vc.issuer} | 発行日: {new Date(vc.issuedAt).toLocaleDateString("ja-JP")}
                          </p>
                          {vc.verified && (
                            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              ✅ 検証済み
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveVC(vc.id)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                        >
                          削除
                        </button>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          含まれる情報（ZKPで選択的に開示可能）:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(vc.attributes).map((key) => (
                            <span
                              key={key}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {key === "myNumber" ? "マイナンバー（非表示）" : key}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ゼロ知識証明タブ */}
      {activeTab === "zkp" && (
        <div className="space-y-8">
          {/* 説明カード */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ゼロ知識証明とは？</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>ゼロ知識証明（Zero-Knowledge Proof）</strong>は、ローカルに保存された
                <strong>VC（Verifiable Credential：検証可能な証明書）</strong>に基づいて条件を証明します。
              </p>
              <div className="bg-white rounded-xl p-4 border border-indigo-300 mb-3">
                <h3 className="font-bold text-indigo-900 mb-2">✅ ZKPで証明可能なもの</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>ローカルに保存されたVC（Verifiable Credential）に基づく条件証明</li>
                  <li>例：VCに「TOEIC 850点」が含まれているが、「800点以上」という条件を満たすことを証明（実際のスコアは開示しない）</li>
                  <li>例：VCに「年齢26歳」が含まれているが、「25歳以上」という条件を満たすことを証明（実際の年齢は開示しない）</li>
                </ul>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-300 mb-3">
                <h3 className="font-bold text-red-900 mb-2">❌ ZKPで証明すべきではないもの</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong>NFT証明書</strong>（ブロックチェーン上に公開されているため、選択開示できない）</li>
                  <li><strong>スタンプ</strong>（ブロックチェーン上に公開されているため、選択開示できない）</li>
                  <li>ユーザーが自分で入力した個人情報（名前、大学、専攻など）</li>
                </ul>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-300">
                <h3 className="font-bold text-yellow-900 mb-2">💡 NFTとVCの違い</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-yellow-800">
                  <li><strong>NFT</strong>：ブロックチェーン上に公開されている。誰でも見ることができる。ZKP不要。</li>
                  <li><strong>VC</strong>：ローカルに保存されている。詳細情報を含む。ZKPで選択的に開示可能。</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 証明生成セクション */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">証明の生成</h2>
            
            <div className="space-y-6">
              {/* 証明内容の選択 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  証明したい内容（ローカルのVCに基づく）
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                    <input type="checkbox" className="w-5 h-5 text-indigo-600" defaultChecked />
                    <div>
                      <span className="text-gray-700 font-medium">TOEICスコアが800点以上である</span>
                      <p className="text-xs text-gray-500 mt-1">（VCに含まれるスコア情報に基づく。実際のスコアは開示しない）</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                    <input type="checkbox" className="w-5 h-5 text-indigo-600" />
                    <div>
                      <span className="text-gray-700 font-medium">年齢が25歳以上である</span>
                      <p className="text-xs text-gray-500 mt-1">（VCに含まれる年齢情報に基づく。実際の年齢は開示しない）</p>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  ※ これらの証明は、ローカルに保存されたVC（Verifiable Credential）に基づいています。
                  VCは信頼できる発行者（企業、大学、試験機関など）が発行した検証可能な証明書です。
                </p>
              </div>

              {/* 生成ボタン */}
              <button
                onClick={handleGenerateProof}
                disabled={proofStatus === "generating"}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
              >
                {proofStatus === "generating" ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>証明を生成中...</span>
                  </span>
                ) : (
                  "🔐 ゼロ知識証明を生成"
                )}
              </button>
            </div>
          </div>

          {/* 証明結果 */}
          {proofStatus === "success" && proofData && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">証明が生成されました</h2>
              </div>

              <div className="space-y-4">
                {/* 証明データ */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">証明データ</h3>
                  <div className="space-y-4 text-sm">
                    {/* 満たした条件 */}
                    {proofData.satisfiedConditions && (
                      <div>
                        <span className="text-gray-600 font-semibold">満たした条件:</span>
                        <div className="mt-2 space-y-2">
                          {proofData.satisfiedConditions.map((cond, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-green-50 rounded-lg border border-green-200"
                            >
                              <span className="text-green-800">
                                ✅ {cond.type}: {cond.condition}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 公開情報（開示） */}
                    {proofData.publicInputs && (
                      <div>
                        <span className="text-gray-600 font-semibold">公開情報（開示）:</span>
                        <div className="mt-2 p-3 bg-white rounded-lg border">
                          <div className="space-y-1">
                            {Object.entries(proofData.publicInputs).map(([key, value]) => (
                              <div key={key} className="text-gray-900">
                                <span className="font-semibold">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 非開示情報（秘匿） */}
                    {proofData.hiddenAttributes && (
                      <div>
                        <span className="text-gray-600 font-semibold">非開示情報（秘匿）:</span>
                        <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                          <ul className="space-y-1 text-gray-600">
                            {Object.entries(proofData.hiddenAttributes).map(([key, value]) => (
                              <li key={key}>
                                ❌ {key}: {value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 検証ボタン */}
                <button
                  onClick={handleVerifyProof}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  🔍 証明を検証する
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

