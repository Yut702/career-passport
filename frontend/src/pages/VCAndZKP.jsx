import { useState } from "react";

// dataディレクトリのVCファイルを動的に読み込む
const vcModules = import.meta.glob("/src/data/sample-vcs/*.json", {
  eager: true,
});

// 初期VCを読み込む関数
const loadInitialVCs = () => {
  try {
    const savedVCs = localStorage.getItem("studentVCs");
    if (savedVCs) {
      return JSON.parse(savedVCs);
    }
  } catch (error) {
    console.error("Failed to parse saved VCs:", error);
  }
  return [];
};

// 利用可能なVCファイル一覧を取得
const getAvailableVCs = () => {
  return Object.keys(vcModules).map((path) => {
    const fileName = path.split("/").pop();
    const vcData = vcModules[path].default || vcModules[path];
    return {
      path,
      fileName,
      data: vcData,
      displayName: vcData.description || vcData.type || fileName,
    };
  });
};

export default function VCAndZKP() {
  const [activeTab, setActiveTab] = useState("vc"); // "vc" or "zkp"
  const [vcs, setVcs] = useState(loadInitialVCs);
  const availableVCs = getAvailableVCs();
  const [selectedVCFiles, setSelectedVCFiles] = useState([]); // 複数選択対応
  const [loading, setLoading] = useState(false);
  const [proofStatus, setProofStatus] = useState("idle");
  const [proofData, setProofData] = useState(null);
  const [selectedVCsForProof, setSelectedVCsForProof] = useState([]);
  // ZKP生成時の開示属性選択
  const [disclosureOptions, setDisclosureOptions] = useState({
    age: false,
    toeicScore: false,
    dateOfBirth: false,
    nationality: false,
    toeicTestDate: false,
    toeicTestCenter: false,
    university: false,
    major: false,
    degree: false,
  });

  const handleRemoveVC = (vcId) => {
    const updatedVCs = vcs.filter((vc) => vc.id !== vcId);
    setVcs(updatedVCs);
    localStorage.setItem("studentVCs", JSON.stringify(updatedVCs));
  };

  // dataディレクトリのVCファイルを複数読み込む
  const handleLoadVCsFromFiles = () => {
    if (selectedVCFiles.length === 0) return;

    setLoading(true);
    const newVCs = [];
    const skippedVCs = [];

    selectedVCFiles.forEach((vcPath) => {
      const selectedVC = availableVCs.find((vc) => vc.path === vcPath);
      if (selectedVC) {
        // 既に同じIDのVCが存在するかチェック
        const existingVC = vcs.find((vc) => vc.id === selectedVC.data.id);
        if (existingVC) {
          skippedVCs.push(selectedVC.fileName);
          return;
        }

        // VCを追加
        const newVC = {
          ...selectedVC.data,
          loadedFromFile: true,
          fileName: selectedVC.fileName,
        };
        newVCs.push(newVC);
      }
    });

    if (newVCs.length > 0) {
      const updatedVCs = [...vcs, ...newVCs];
      setVcs(updatedVCs);
      localStorage.setItem("studentVCs", JSON.stringify(updatedVCs));
    }

    if (skippedVCs.length > 0) {
      alert(`以下のVCは既に追加されています:\n${skippedVCs.join("\n")}`);
    }

    if (newVCs.length > 0) {
      alert(`${newVCs.length}個のVCを追加しました。`);
    }

    setSelectedVCFiles([]);
    setLoading(false);
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

  // VCから年齢を計算
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // 選択したVCからデータを抽出して証明を生成
  const handleGenerateProof = async () => {
    if (selectedVCsForProof.length === 0) {
      alert("証明に使用するVCを選択してください。");
      return;
    }

    setProofStatus("generating");

    // 選択したVCからデータを抽出
    const selectedVCData = vcs.filter((vc) =>
      selectedVCsForProof.includes(vc.id)
    );

    // VCから年齢とTOEICスコアを抽出
    let age = null;
    let dateOfBirth = null;
    let toeicScore = null;
    let toeicTestDate = null;
    let toeicTestCenter = null;
    let nationality = null;

    selectedVCData.forEach((vc) => {
      if (vc.type === "myNumber" && vc.attributes) {
        if (vc.attributes.dateOfBirth) {
          dateOfBirth = vc.attributes.dateOfBirth;
          age = calculateAge(dateOfBirth);
        }
        if (vc.attributes.nationality) {
          nationality = vc.attributes.nationality;
        }
      }
      if (vc.type === "toeic" && vc.attributes) {
        if (vc.attributes.score) {
          toeicScore = vc.attributes.score;
        }
        if (vc.attributes.testDate) {
          toeicTestDate = vc.attributes.testDate;
        }
        if (vc.attributes.testCenter) {
          toeicTestCenter = vc.attributes.testCenter;
        }
      }
    });

    // モック: ゼロ知識証明の生成（実際のVCデータを使用）
    setTimeout(() => {
      const timestamp = new Date().toISOString();
      const satisfiedConditions = [];
      const publicInputs = {};
      const hiddenAttributes = {};

      // 年齢条件のチェック
      if (age !== null) {
        const ageCondition = ">= 25";
        const ageSatisfied = age >= 25;
        satisfiedConditions.push({
          type: "age",
          condition: ageCondition,
          satisfied: ageSatisfied,
        });
        if (ageSatisfied) {
          if (disclosureOptions.age) {
            publicInputs.age = age;
          }
          publicInputs.ageCondition = ageCondition;
        }
        if (dateOfBirth) {
          hiddenAttributes.dateOfBirth = disclosureOptions.dateOfBirth
            ? dateOfBirth
            : "hidden";
        }
        if (nationality) {
          hiddenAttributes.nationality = disclosureOptions.nationality
            ? nationality
            : "hidden";
        }
      }

      // TOEIC条件のチェック
      if (toeicScore !== null) {
        const toeicCondition = ">= 800";
        const toeicSatisfied = toeicScore >= 800;
        satisfiedConditions.push({
          type: "toeic",
          condition: toeicCondition,
          satisfied: toeicSatisfied,
        });
        if (toeicSatisfied) {
          if (disclosureOptions.toeicScore) {
            publicInputs.toeic = toeicScore;
          }
          publicInputs.toeicCondition = toeicCondition;
        }
        hiddenAttributes.exactScore = "hidden";
        if (toeicTestDate) {
          hiddenAttributes.testDate = disclosureOptions.toeicTestDate
            ? toeicTestDate
            : "hidden";
        }
        if (toeicTestCenter) {
          hiddenAttributes.testCenter = disclosureOptions.toeicTestCenter
            ? toeicTestCenter
            : "hidden";
        }
      }

      // 学位情報の抽出と開示設定
      selectedVCData.forEach((vc) => {
        if (vc.type === "degree" && vc.attributes) {
          if (vc.attributes.university && disclosureOptions.university) {
            publicInputs.university = vc.attributes.university;
          } else if (vc.attributes.university) {
            hiddenAttributes.university = "hidden";
          }
          if (vc.attributes.major && disclosureOptions.major) {
            publicInputs.major = vc.attributes.major;
          } else if (vc.attributes.major) {
            hiddenAttributes.major = "hidden";
          }
          if (vc.attributes.degree && disclosureOptions.degree) {
            publicInputs.degree = vc.attributes.degree;
          } else if (vc.attributes.degree) {
            hiddenAttributes.degree = "hidden";
          }
        }
      });

      setProofData({
        proof: {
          type: "BbsBlsSignatureProof2020",
          created: timestamp,
          proofPurpose: "assertionMethod",
          proofValue:
            "z5F8k" + Math.random().toString(16).substr(2, 60) + "...",
          verificationMethod: "did:web:gov.example:my-number#key-1",
          revealedAttributes: Object.keys(publicInputs),
          nonce: Math.random().toString(16).substr(2, 32),
        },
        publicInputs,
        hiddenAttributes,
        satisfiedConditions,
        usedVCs: selectedVCData.map((vc) => ({
          id: vc.id,
          type: vc.type,
          issuer: vc.issuer,
        })),
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
          <h1 className="text-4xl font-bold text-gray-900">
            VC管理とゼロ知識証明
          </h1>
          <p className="text-gray-600 mt-1">将来用の機能（実証実験レベル）</p>
        </div>
      </div>

      {/* 前提条件の警告 */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 mb-2 text-lg">
              前提条件と現状について
            </h3>
            <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1 ml-2">
              <li>
                マイナンバーカードや学位証明書のVC形式は
                <strong>実証実験レベル</strong>
                です（デジタル庁や一部大学で実証実験中）
              </li>
              <li>現時点では一般的には利用できません</li>
              <li>
                この実装は<strong>将来的なVC取得機能とZKP機能のモック</strong>
                です
              </li>
              <li>実際のVC取得APIとZKP実装は未実装です（将来的に実装予定）</li>
              <li>
                VCは信頼できる発行者（政府、大学、試験機関など）が発行した検証可能な証明書です
              </li>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                VC（検証可能な証明書）管理
              </h2>
              <p className="text-gray-600 mb-4">
                信頼できる発行者が発行したVCを管理し、ZKPで選択的に開示できます
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🔐</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 mb-1">
                      VC（Verifiable Credential）とは
                    </h3>
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

              {/* dataディレクトリからVCを読み込む（複数選択対応） */}
              <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <h4 className="text-lg font-bold text-gray-900 mb-3">
                  📁 dataディレクトリのVCファイルから読み込む（複数選択可能）
                </h4>
                <div className="space-y-3">
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                    {availableVCs
                      .filter(
                        (vc) =>
                          !vc.fileName.includes("README") &&
                          !vc.fileName.includes("VC_AND_NFT")
                      )
                      .map((vc) => {
                        const isAlreadyAdded = vcs.some(
                          (existingVC) => existingVC.id === vc.data.id
                        );
                        return (
                          <label
                            key={vc.path}
                            className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedVCFiles.includes(vc.path)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVCFiles([
                                    ...selectedVCFiles,
                                    vc.path,
                                  ]);
                                } else {
                                  setSelectedVCFiles(
                                    selectedVCFiles.filter(
                                      (path) => path !== vc.path
                                    )
                                  );
                                }
                              }}
                              disabled={isAlreadyAdded || loading}
                              className="w-5 h-5 text-blue-600 mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">
                                  {vc.fileName}
                                </span>
                                {isAlreadyAdded && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                    既に追加済み
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {vc.displayName}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleLoadVCsFromFiles}
                      disabled={selectedVCFiles.length === 0 || loading}
                      className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading
                        ? "読み込み中..."
                        : `選択した${selectedVCFiles.length}個のVCを読み込む`}
                    </button>
                    <button
                      onClick={() => setSelectedVCFiles([])}
                      disabled={selectedVCFiles.length === 0 || loading}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      選択をクリア
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  data/sample-vcsディレクトリにあるVCファイルを複数選択して一度に読み込むことができます
                </p>
              </div>
            </div>

            {/* VC一覧 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                保存されたVC
              </h3>
              {vcs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 text-lg mb-2">
                    まだVCが登録されていません
                  </p>
                  <p className="text-sm text-gray-400">
                    上記のドロップダウンからVCファイルを選択して読み込んでください
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
                            発行者: {vc.issuer} | 発行日:{" "}
                            {new Date(vc.issuedAt).toLocaleDateString("ja-JP")}
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
                              {key === "myNumber"
                                ? "マイナンバー（非表示）"
                                : key}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ゼロ知識証明とは？
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>ゼロ知識証明（Zero-Knowledge Proof）</strong>
                は、ローカルに保存された
                <strong>VC（Verifiable Credential：検証可能な証明書）</strong>
                に基づいて条件を証明します。
              </p>
              <div className="bg-white rounded-xl p-4 border border-indigo-300 mb-3">
                <h3 className="font-bold text-indigo-900 mb-2">
                  ✅ ZKPで証明可能なもの
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>
                    ローカルに保存されたVC（Verifiable
                    Credential）に基づく条件証明
                  </li>
                  <li>
                    例：VCに「TOEIC
                    850点」が含まれているが、「800点以上」という条件を満たすことを証明（実際のスコアは開示しない）
                  </li>
                  <li>
                    例：VCに「年齢26歳」が含まれているが、「25歳以上」という条件を満たすことを証明（実際の年齢は開示しない）
                  </li>
                </ul>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-300 mb-3">
                <h3 className="font-bold text-red-900 mb-2">
                  ❌ ZKPで証明すべきではないもの
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>
                    <strong>NFT証明書</strong>
                    （ブロックチェーン上に公開されているため、選択開示できない）
                  </li>
                  <li>
                    <strong>スタンプ</strong>
                    （ブロックチェーン上に公開されているため、選択開示できない）
                  </li>
                  <li>
                    ユーザーが自分で入力した個人情報（名前、大学、専攻など）
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-300">
                <h3 className="font-bold text-yellow-900 mb-2">
                  💡 NFTとVCの違い
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-yellow-800">
                  <li>
                    <strong>NFT</strong>
                    ：ブロックチェーン上に公開されている。誰でも見ることができる。ZKP不要。
                  </li>
                  <li>
                    <strong>VC</strong>
                    ：ローカルに保存されている。詳細情報を含む。ZKPで選択的に開示可能。
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 証明生成セクション */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              証明の生成
            </h2>

            <div className="space-y-6">
              {/* VC選択セクション */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  証明に使用するVCを選択（複数選択可能）
                </label>
                {vcs.length === 0 ? (
                  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-yellow-800 text-sm">
                      ⚠️
                      VCが登録されていません。先にVC管理タブでVCを追加してください。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vcs.map((vc) => (
                      <label
                        key={vc.id}
                        className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedVCsForProof.includes(vc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVCsForProof([
                                ...selectedVCsForProof,
                                vc.id,
                              ]);
                            } else {
                              const newSelected = selectedVCsForProof.filter(
                                (id) => id !== vc.id
                              );
                              setSelectedVCsForProof(newSelected);
                              // VC選択が変更されたら開示オプションをリセット
                              if (newSelected.length === 0) {
                                setDisclosureOptions({
                                  age: false,
                                  toeicScore: false,
                                  dateOfBirth: false,
                                  nationality: false,
                                  toeicTestDate: false,
                                  toeicTestCenter: false,
                                  university: false,
                                  major: false,
                                  degree: false,
                                });
                              }
                            }
                          }}
                          className="w-5 h-5 text-indigo-600 mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-gray-700 font-medium">
                              {getVCDisplayName(vc.type)}
                            </span>
                            {vc.loadedFromFile && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                ファイルから読み込み
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            発行者: {vc.issuer} |{" "}
                            {vc.type === "myNumber" &&
                              "年齢条件の証明に使用可能"}
                            {vc.type === "toeic" &&
                              "TOEICスコア条件の証明に使用可能"}
                            {vc.type === "degree" && "学位条件の証明に使用可能"}
                            {vc.type === "certification" &&
                              "資格条件の証明に使用可能"}
                          </p>
                          {vc.fileName && (
                            <p className="text-xs text-gray-400 mt-1">
                              ファイル: {vc.fileName}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  ※
                  選択したVCから実際のデータを読み取り、条件を満たすことを証明します。
                  個人情報は開示せずに、条件を満たすことのみを証明できます。
                </p>
              </div>

              {/* 開示属性の選択セクション */}
              {selectedVCsForProof.length > 0 && (
                <div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    🔓 開示する情報を選択
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    ゼロ知識証明で開示する情報を選択してください。選択しなかった情報は非開示（秘匿）されます。
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 年齢関連 */}
                    {vcs.filter(
                      (vc) =>
                        selectedVCsForProof.includes(vc.id) &&
                        vc.type === "myNumber"
                    ).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 text-sm">
                          年齢・個人情報
                        </h4>
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.age}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                age: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            年齢を開示
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.dateOfBirth}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                dateOfBirth: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            生年月日を開示
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.nationality}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                nationality: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            国籍を開示
                          </span>
                        </label>
                      </div>
                    )}

                    {/* TOEIC関連 */}
                    {vcs.filter(
                      (vc) =>
                        selectedVCsForProof.includes(vc.id) &&
                        vc.type === "toeic"
                    ).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 text-sm">
                          TOEIC情報
                        </h4>
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.toeicScore}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                toeicScore: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            TOEICスコアを開示
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.toeicTestDate}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                toeicTestDate: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            受験日を開示
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.toeicTestCenter}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                toeicTestCenter: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            試験会場を開示
                          </span>
                        </label>
                      </div>
                    )}

                    {/* 学位関連 */}
                    {vcs.filter(
                      (vc) =>
                        selectedVCsForProof.includes(vc.id) &&
                        vc.type === "degree"
                    ).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 text-sm">
                          学位情報
                        </h4>
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.university}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                university: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            大学名を開示
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.major}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                major: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            専攻を開示
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.degree}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                degree: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            学位を開示
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    ※
                    チェックを入れなかった情報は非開示（秘匿）され、条件を満たすことのみが証明されます。
                  </p>
                </div>
              )}

              {/* 生成ボタン */}
              <button
                onClick={handleGenerateProof}
                disabled={
                  proofStatus === "generating" ||
                  selectedVCsForProof.length === 0 ||
                  selectedVCsForProof.length === 0
                }
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
              >
                {proofStatus === "generating" ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
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
                <h2 className="text-2xl font-bold text-gray-900">
                  証明が生成されました
                </h2>
              </div>

              <div className="space-y-4">
                {/* 証明データ */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">証明データ</h3>
                  <div className="space-y-4 text-sm">
                    {/* 使用したVC */}
                    {proofData.usedVCs && (
                      <div>
                        <span className="text-gray-600 font-semibold">
                          使用したVC:
                        </span>
                        <div className="mt-2 space-y-2">
                          {proofData.usedVCs.map((vc, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <span className="text-blue-800">
                                📄 {getVCDisplayName(vc.type)} ({vc.issuer})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 満たした条件 */}
                    {proofData.satisfiedConditions && (
                      <div>
                        <span className="text-gray-600 font-semibold">
                          満たした条件:
                        </span>
                        <div className="mt-2 space-y-2">
                          {proofData.satisfiedConditions.map((cond, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${
                                cond.satisfied
                                  ? "bg-green-50 border-green-200"
                                  : "bg-red-50 border-red-200"
                              }`}
                            >
                              <span
                                className={
                                  cond.satisfied
                                    ? "text-green-800"
                                    : "text-red-800"
                                }
                              >
                                {cond.satisfied ? "✅" : "❌"} {cond.type}:{" "}
                                {cond.condition}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 公開情報（開示） */}
                    {proofData.publicInputs && (
                      <div>
                        <span className="text-gray-600 font-semibold">
                          公開情報（開示）:
                        </span>
                        <div className="mt-2 p-3 bg-white rounded-lg border">
                          <div className="space-y-1">
                            {Object.entries(proofData.publicInputs).map(
                              ([key, value]) => (
                                <div key={key} className="text-gray-900">
                                  <span className="font-semibold">{key}:</span>{" "}
                                  {value}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 非開示情報（秘匿） */}
                    {proofData.hiddenAttributes && (
                      <div>
                        <span className="text-gray-600 font-semibold">
                          非開示情報（秘匿）:
                        </span>
                        <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                          <ul className="space-y-1 text-gray-600">
                            {Object.entries(proofData.hiddenAttributes).map(
                              ([key, value]) => (
                                <li key={key}>
                                  ❌ {key}: {value}
                                </li>
                              )
                            )}
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
