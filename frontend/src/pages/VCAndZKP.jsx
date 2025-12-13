import { useState, useEffect } from "react";
import { generateToeicProof, generateDegreeProof } from "../lib/zkp/prover.js";
import { verifyProofs } from "../lib/zkp/verifier.js";
import { checkConditions, hashProof } from "../lib/zkp/utils.js";
import {
  getVCType,
  getCredentialSubject,
  getIssuerName,
  getIssuanceDate,
} from "../lib/vc/vc-utils.js";
import { storage } from "../lib/storage";
import { useWallet } from "../hooks/useWallet.js";
import { zkpProofAPI } from "../lib/api.js";

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

// 利用可能なVCファイル一覧を取得（W3C標準形式をそのまま使用）
const getAvailableVCs = () => {
  return Object.keys(vcModules).map((path) => {
    const fileName = path.split("/").pop();
    const vcData = vcModules[path].default || vcModules[path];

    return {
      path,
      fileName,
      data: vcData, // W3C標準形式をそのまま使用
      displayName: vcData.description || getVCType(vcData) || fileName,
    };
  });
};

export default function VCAndZKP() {
  const { account } = useWallet();
  const [activeTab, setActiveTab] = useState("vc"); // "vc" or "zkp"
  const [vcs, setVcs] = useState(loadInitialVCs);
  const availableVCs = getAvailableVCs();
  const [selectedVCFiles, setSelectedVCFiles] = useState([]); // 複数選択対応
  const [loading, setLoading] = useState(false);
  const [proofStatus, setProofStatus] = useState("idle");
  const [proofData, setProofData] = useState(null);
  const [selectedVCForProof, setSelectedVCForProof] = useState(null); // 単一選択
  const [verifiedZKPProofs, setVerifiedZKPProofs] = useState([]); // 検証済みZKP証明一覧
  // 証明条件の設定（ユーザーが入力）
  const [proofConditions, setProofConditions] = useState({
    minToeicScore: 800,
    minGpa: 0, // 0の場合はチェックしない
  });
  // ZKP生成時の開示属性選択
  const [disclosureOptions, setDisclosureOptions] = useState({
    toeicScore: false,
    toeicTestDate: false,
    toeicTestCenter: false,
    university: false,
    major: false,
    degree: false,
    gpa: false,
  });

  const handleRemoveVC = (vcId) => {
    const updatedVCs = vcs.filter((vc) => vc.id !== vcId);
    setVcs(updatedVCs);
    localStorage.setItem("studentVCs", JSON.stringify(updatedVCs));
  };

  // 検証済みZKP証明を読み込む
  useEffect(() => {
    const loadVerifiedZKPProofs = async () => {
      if (!account) {
        // ウォレット未接続時はローカルストレージから読み込む
        const proofs = storage.getZKPProofs();
        const verifiedProofs = proofs.filter(
          (p) => p.verifyResult?.verified === true
        );
        setVerifiedZKPProofs(verifiedProofs);
        return;
      }

      try {
        // データベースから公開情報を取得
        const response = await zkpProofAPI.getZKPProofs(account);
        if (response.ok && response.proofs) {
          // 検証済みのもののみをフィルタ
          const verified = response.proofs.filter(
            (p) => p.verified === true || p.verifiedAt
          );
          setVerifiedZKPProofs(verified);
        } else {
          // フォールバック: ローカルストレージから読み込む
          const proofs = storage.getZKPProofs();
          const verifiedProofs = proofs.filter(
            (p) => p.verifyResult?.verified === true
          );
          setVerifiedZKPProofs(verifiedProofs);
        }
      } catch (err) {
        console.error("Error loading ZKP proofs:", err);
        // エラー時はローカルストレージから読み込む
        const proofs = storage.getZKPProofs();
        const verifiedProofs = proofs.filter(
          (p) => p.verifyResult?.verified === true
        );
        setVerifiedZKPProofs(verifiedProofs);
      }
    };

    loadVerifiedZKPProofs();
  }, [account]);

  // VCが検証済みかどうかを判定
  const isVCVerified = (vc) => {
    const vcType = getVCType(vc);
    const vcId = vc.id;

    // 検証済みZKP証明の中に、このVCを使用したものがあるかチェック
    return verifiedZKPProofs.some((proof) => {
      if (proof.usedVCs && Array.isArray(proof.usedVCs)) {
        return proof.usedVCs.some(
          (usedVC) => usedVC.id === vcId || usedVC.type === vcType
        );
      }
      return false;
    });
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

  const getVCDisplayName = (vc) => {
    const type = typeof vc === "string" ? vc : getVCType(vc);
    const names = {
      myNumber: "マイナンバーカード",
      toeic: "TOEIC証明書",
      degree: "学位証明書",
    };
    return names[type] || type;
  };

  // 選択したVCからデータを抽出して証明を生成
  const handleGenerateProof = async () => {
    if (!selectedVCForProof) {
      alert("証明に使用するVCを選択してください。");
      return;
    }

    setProofStatus("generating");

    try {
      // 選択したVCからデータを抽出（1つのVCのみ）
      const selectedVC = vcs.find((vc) => vc.id === selectedVCForProof);
      if (!selectedVC) {
        alert("選択したVCが見つかりません。");
        setProofStatus("idle");
        return;
      }
      const selectedVCData = [selectedVC];

      // ユーザーが設定した条件を使用
      const conditions = {
        minToeicScore: proofConditions.minToeicScore,
        minGpa: proofConditions.minGpa,
      };

      // 条件を満たしているかチェック（事前検証）
      const conditionResults = checkConditions(selectedVCData, conditions);
      const satisfiedConditions = [];
      const proofs = [];
      const publicInputs = {};
      const hiddenAttributes = {};

      // 選択されたVCのタイプに応じて証明を生成（1つのVCのみ）
      // TOEIC証明を生成（TOEIC VCが選択されている場合）
      if (getVCType(selectedVC) === "toeic" && conditionResults.toeic) {
        const toeicVC = selectedVC;
        const attributes = getCredentialSubject(toeicVC);
        if (attributes.score) {
          const toeicSatisfied = conditionResults.toeic.satisfied;
          satisfiedConditions.push({
            type: "toeic",
            condition: conditionResults.toeic.condition,
            satisfied: toeicSatisfied,
          });

          if (toeicSatisfied) {
            try {
              const toeicProof = await generateToeicProof({
                score: attributes.score,
                minScore: conditions.minToeicScore,
              });

              proofs.push({
                type: "toeic",
                proof: toeicProof.proof,
                publicSignals: toeicProof.publicSignals,
              });

              publicInputs.minToeicScore = conditions.minToeicScore;
              if (
                disclosureOptions.toeicScore &&
                conditionResults.toeic.value
              ) {
                publicInputs.toeicScore = conditionResults.toeic.value;
              }
              hiddenAttributes.exactToeicScore = disclosureOptions.toeicScore
                ? conditionResults.toeic.value
                : "hidden";
            } catch (error) {
              console.error("Error generating TOEIC proof:", error);
              alert(`TOEIC証明の生成に失敗しました: ${error.message}`);
            }
          }
        }
      }

      // 学位証明を生成（学位VCが選択されている場合）
      if (getVCType(selectedVC) === "degree" && conditionResults.degree) {
        const degreeVC = selectedVC;
        const attributes = getCredentialSubject(degreeVC);
        if (attributes.gpa !== undefined) {
          const degreeSatisfied = conditionResults.degree.satisfied;
          satisfiedConditions.push({
            type: "degree",
            condition: conditionResults.degree.condition,
            satisfied: degreeSatisfied,
          });

          if (degreeSatisfied) {
            try {
              const degreeProof = await generateDegreeProof({
                gpa: attributes.gpa,
                minGpa: conditions.minGpa,
              });

              // スキップされていない場合のみ証明を追加
              if (!degreeProof.skipped) {
                proofs.push({
                  type: "degree",
                  proof: degreeProof.proof,
                  publicSignals: degreeProof.publicSignals,
                });
              } else {
                // スキップされた場合でも、条件を満たしていることを記録
                proofs.push({
                  type: "degree",
                  proof: { skipped: true },
                  publicSignals: [],
                });
              }

              if (conditions.minGpa > 0) {
                publicInputs.minGpa = conditions.minGpa;
              }
              if (disclosureOptions.gpa && conditionResults.degree.value) {
                publicInputs.gpa = conditionResults.degree.value;
              }
              if (disclosureOptions.university && attributes.university) {
                publicInputs.university = attributes.university;
              } else if (attributes.university) {
                hiddenAttributes.university = "hidden";
              }
              if (disclosureOptions.major && attributes.major) {
                publicInputs.major = attributes.major;
              } else if (attributes.major) {
                hiddenAttributes.major = "hidden";
              }
              if (disclosureOptions.degree && attributes.degree) {
                publicInputs.degree = attributes.degree;
              } else if (attributes.degree) {
                hiddenAttributes.degree = "hidden";
              }
            } catch (error) {
              console.error("Error generating degree proof:", error);
              alert(`学位証明の生成に失敗しました: ${error.message}`);
            }
          }
        }
      }

      // 証明が1つも生成されなかった場合
      if (proofs.length === 0) {
        const failedConditions = satisfiedConditions.filter(
          (c) => !c.satisfied
        );
        if (failedConditions.length > 0) {
          alert(
            "選択したVCは条件を満たしていません。\n" +
              failedConditions
                .map((c) => `${c.type}: ${c.condition}`)
                .join("\n")
          );
        } else {
          alert(
            "証明を生成できませんでした。VCが正しく選択されているか確認してください。"
          );
        }
        setProofStatus("idle");
        return;
      }

      const timestamp = new Date().toISOString();
      const proofHash = hashProof({ proofs, timestamp });

      setProofData({
        proofs, // 複数の証明を配列で保持
        publicInputs,
        hiddenAttributes,
        satisfiedConditions,
        usedVCs: [
          {
            id: selectedVC.id,
            type: getVCType(selectedVC),
            issuer: getIssuerName(selectedVC),
          },
        ],
        timestamp: timestamp,
        proofHash: proofHash,
        conditions: conditions,
      });
      setProofStatus("success");
    } catch (error) {
      console.error("Error generating proof:", error);
      alert(
        `証明の生成に失敗しました: ${error.message}\n\n注意: 回路ファイル（.wasm, .zkey）がビルドされていることを確認してください。`
      );
      setProofStatus("idle");
    }
  };

  const handleVerifyProof = async () => {
    if (!proofData || !proofData.proofs) return;
    setProofStatus("verifying");

    try {
      // 実際のZKP証明を検証（複数の証明を検証）
      // skipped: trueの証明は検証から除外
      const validProofs = proofData.proofs.filter(
        (p) =>
          !p.proof?.skipped &&
          p.proof &&
          p.publicSignals &&
          p.publicSignals.length > 0
      );

      // スキップされた証明を確認
      const skippedProofs = proofData.proofs.filter((p) => p.proof?.skipped);

      if (validProofs.length === 0) {
        // すべての証明がスキップされた場合
        if (skippedProofs.length > 0) {
          // スキップされた証明がある場合、検証不要として扱う
          const updatedProofData = {
            ...proofData,
            verifyResult: {
              verified: true,
              results: skippedProofs.map((p) => ({
                type: p.type,
                verified: true,
                skipped: true,
                message:
                  p.type === "degree"
                    ? "GPA条件なし（学位証明書VCの存在のみ証明）"
                    : "証明がスキップされました",
              })),
              conditions: proofData.satisfiedConditions || [],
              timestamp: proofData.timestamp,
              verifiedAt: new Date().toISOString(),
            },
          };
          setProofData(updatedProofData);
          setProofStatus("success");

          // スキップされた証明でもファイルを保存
          try {
            // 一意のproofIdを生成（proofHash + タイムスタンプ + ランダム文字列）
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substr(2, 9);
            const proofId = updatedProofData.proofHash
              ? `${updatedProofData.proofHash}_${timestamp}_${randomStr}`
              : `zkp_${timestamp}_${randomStr}`;

            // ローカルストレージにも保存（後方互換性のため）
            storage.addZKPProof({
              ...updatedProofData,
              id: proofId,
            });

            // ウォレット接続されている場合、dataフォルダとデータベースに保存
            if (account) {
              try {
                // 公開情報のみを抽出
                const publicInfo = {
                  proofHash: updatedProofData.proofHash,
                  publicInputs: updatedProofData.publicInputs || {},
                  usedVCs: updatedProofData.usedVCs || [],
                  satisfiedConditions:
                    updatedProofData.satisfiedConditions || [],
                  verified: true, // 検証済みフラグ
                  verifiedAt:
                    updatedProofData.verifyResult?.verifiedAt ||
                    new Date().toISOString(),
                };

                // 完全な証明データと公開情報をAPI経由で保存
                await zkpProofAPI.saveZKPProof(
                  account,
                  { ...updatedProofData, id: proofId },
                  publicInfo
                );
              } catch (apiError) {
                console.error("Error saving ZKP proof to API:", apiError);
                // API保存エラーは警告のみ（ローカルストレージには保存済み）
              }
            }
          } catch (error) {
            console.error("Error saving ZKP proof:", error);
          }

          return;
        } else {
          throw new Error(
            "検証可能な証明がありません。証明が正しく生成されているか確認してください。"
          );
        }
      }

      const proofResult = {
        proofs: validProofs.map((p) => ({
          type: p.type,
          proof: {
            proof: p.proof,
            publicSignals: p.publicSignals,
          },
        })),
      };

      const verifyResult = await verifyProofs(proofResult);

      // スキップされた証明も結果に含める
      const allResults = [
        ...verifyResult.results,
        ...skippedProofs.map((p) => ({
          type: p.type,
          verified: true,
          skipped: true,
          message:
            p.type === "degree"
              ? "GPA条件なし（学位証明書VCの存在のみ証明）"
              : "証明がスキップされました",
        })),
      ];

      const updatedProofData = {
        ...proofData,
        verifyResult: {
          verified: verifyResult.allVerified,
          results: allResults,
          conditions: proofData.satisfiedConditions || [],
          timestamp: proofData.timestamp,
          verifiedAt: new Date().toISOString(),
        },
      };
      setProofData(updatedProofData);

      // 検証成功した証明を保存
      if (verifyResult.allVerified) {
        try {
          // 一意のproofIdを生成（proofHash + タイムスタンプ + ランダム文字列）
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substr(2, 9);
          const proofId = updatedProofData.proofHash
            ? `${updatedProofData.proofHash}_${timestamp}_${randomStr}`
            : `zkp_${timestamp}_${randomStr}`;

          // ローカルストレージにも保存（後方互換性のため）
          storage.addZKPProof({
            ...updatedProofData,
            id: proofId,
          });

          // ウォレット接続されている場合、dataフォルダとデータベースに保存
          if (account) {
            try {
              // 公開情報のみを抽出
              const publicInfo = {
                proofHash: updatedProofData.proofHash,
                publicInputs: updatedProofData.publicInputs || {},
                usedVCs: updatedProofData.usedVCs || [],
                satisfiedConditions: updatedProofData.satisfiedConditions || [],
                verified: verifyResult.allVerified, // 検証済みフラグ
                verifiedAt:
                  updatedProofData.verifyResult?.verifiedAt ||
                  new Date().toISOString(),
              };

              // 完全な証明データと公開情報をAPI経由で保存
              await zkpProofAPI.saveZKPProof(
                account,
                { ...updatedProofData, id: proofId },
                publicInfo
              );
            } catch (apiError) {
              console.error("Error saving ZKP proof to API:", apiError);
              // API保存エラーは警告のみ（ローカルストレージには保存済み）
            }
          }
        } catch (error) {
          console.error("Error saving ZKP proof:", error);
        }
      }

      setProofStatus("success"); // 検証後も証明結果を表示するため"success"のまま
    } catch (error) {
      console.error("Error verifying proof:", error);
      setProofData({
        ...proofData,
        verifyResult: {
          verified: false,
          results: [],
          error: error.message,
          verifiedAt: new Date().toISOString(),
        },
      });
      setProofStatus("success"); // エラーでも証明結果を表示するため"success"のまま
    }
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
                    <p className="text-xs text-blue-700 mt-2 p-2 bg-blue-100 rounded">
                      <strong>⚠️ 現在の検証機能:</strong>
                      <br />• VC自体の署名検証（proofフィールド）:{" "}
                      <strong>未実装</strong>
                      <br />
                      • verifiedフラグ:
                      単なるフラグで、実際の署名検証は行われていません
                      <br />• ZKP証明の検証:
                      実装済み（生成されたZKP証明が数学的に正しいかを検証）
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
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  保存されたVC
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 text-lg">ℹ️</span>
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-medium mb-1">
                        W3C標準準拠について
                      </p>
                      <p className="text-xs text-blue-800">
                        本アプリはW3C Verifiable
                        Credentials標準規格に準拠した形式でVCを管理していますが、
                        <strong className="font-semibold">
                          現在は開発・検証用のモック実装のため、発行者の署名（proofフィールド）機能は未実装です。
                        </strong>
                        実際のプロダクション環境では、発行者のデジタル署名による改ざん検証が必要です。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
                            {getVCDisplayName(vc)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            発行者: {getIssuerName(vc)} | 発行日:{" "}
                            {new Date(getIssuanceDate(vc)).toLocaleDateString(
                              "ja-JP"
                            )}
                          </p>
                          {vc.verified && (
                            <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              ⚠️ verifiedフラグのみ（署名検証なし）
                            </span>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              ⚠️ VC署名検証未実装（proofフィールドなし）
                            </span>
                          </div>
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
                          {Object.keys(getCredentialSubject(vc)).map((key) => (
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
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-300">
                <h3 className="font-bold text-blue-900 mb-2">
                  ⚠️ 実装状況について
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    <strong>W3C標準準拠：</strong>
                    本アプリはW3C Verifiable
                    Credentials標準規格に準拠した形式でVCを管理しています。
                  </p>
                  <p>
                    <strong>署名機能（proofフィールド）：</strong>
                    <span className="font-semibold text-blue-900">
                      現在は開発・検証用のモック実装のため、発行者のデジタル署名（proofフィールド）機能は未実装です。
                    </span>
                    実際のプロダクション環境では、発行者のデジタル署名による改ざん検証が必要です。
                  </p>
                  <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      現在の実装での検証機能:
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                      <li>
                        <strong>ZKP証明の検証:</strong> ✅ 実装済み
                        <br />
                        <span className="text-blue-700 ml-4">
                          snarkjs.groth16.verify()を使用して、生成されたZKP証明が数学的に正しいかを検証します。
                        </span>
                      </li>
                      <li>
                        <strong>VC自体の署名検証:</strong> ❌ 未実装
                        <br />
                        <span className="text-blue-700 ml-4">
                          proofフィールドがないため、発行者の署名によるVCの改ざん検証は行われていません。
                          verifiedフラグは単なるフラグで、実際の署名検証ではありません。
                        </span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    ※
                    VCが盗まれた場合、現在の実装では署名検証ができないため、改ざんされたVCでも検証できません。
                    プロダクション環境では、proofフィールドによる署名検証の実装が必須です。
                  </p>
                </div>
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
                  証明に使用するVCを選択（1つのみ選択可能）
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
                          type="radio"
                          name="vc-selection"
                          checked={selectedVCForProof === vc.id}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVCForProof(vc.id);
                              // VC選択が変更されたら開示オプションをリセット
                              setDisclosureOptions({
                                toeicScore: false,
                                toeicTestDate: false,
                                toeicTestCenter: false,
                                university: false,
                                major: false,
                                degree: false,
                                gpa: false,
                              });
                            }
                          }}
                          className="w-5 h-5 text-indigo-600 mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-gray-700 font-medium">
                              {getVCDisplayName(vc)}
                            </span>
                            {vc.loadedFromFile && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                ファイルから読み込み
                              </span>
                            )}
                            {isVCVerified(vc) && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                ✅ 検証済み
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            発行者: {getIssuerName(vc)} |{" "}
                            {getVCType(vc) === "toeic" &&
                              "TOEICスコア条件の証明に使用可能"}
                            {getVCType(vc) === "degree" &&
                              "学位条件の証明に使用可能"}
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

              {/* 証明条件の設定セクション */}
              {selectedVCForProof && (
                <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    ⚙️ 証明する条件を設定
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    選択したVCに応じて、証明したい条件を設定してください。選択したVCに関連する条件のみが表示されます。
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* TOEIC条件の設定 */}
                    {(() => {
                      const selectedVC = vcs.find(
                        (vc) => vc.id === selectedVCForProof
                      );
                      return selectedVC && getVCType(selectedVC) === "toeic";
                    })() && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          最小TOEICスコア
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="990"
                          value={proofConditions.minToeicScore}
                          onChange={(e) =>
                            setProofConditions({
                              ...proofConditions,
                              minToeicScore: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="例: 800"
                        />
                        <p className="text-xs text-gray-500">
                          このスコア以上であることを証明します
                        </p>
                      </div>
                    )}

                    {/* 学位条件の設定（GPA） */}
                    {(() => {
                      const selectedVC = vcs.find(
                        (vc) => vc.id === selectedVCForProof
                      );
                      return selectedVC && getVCType(selectedVC) === "degree";
                    })() && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          最小GPA（0の場合はチェックしない）
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="4"
                          step="0.1"
                          value={proofConditions.minGpa}
                          onChange={(e) =>
                            setProofConditions({
                              ...proofConditions,
                              minGpa: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="例: 3.5"
                        />
                        <p className="text-xs text-gray-500">
                          このGPA以上であることを証明します（0の場合は学位証明書VCの存在のみ証明）
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 開示属性の選択セクション */}
              {selectedVCForProof && (
                <div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    🔓 開示する情報を選択
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    選択したVCに応じて、ゼロ知識証明で開示する情報を選択してください。選択したVCに関連する情報のみが表示されます。選択しなかった情報は非開示（秘匿）されます。
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 年齢関連 */}
                    {/* TOEIC関連 */}
                    {(() => {
                      const selectedVC = vcs.find(
                        (vc) => vc.id === selectedVCForProof
                      );
                      return selectedVC && getVCType(selectedVC) === "toeic";
                    })() && (
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
                    {(() => {
                      const selectedVC = vcs.find(
                        (vc) => vc.id === selectedVCForProof
                      );
                      return selectedVC && getVCType(selectedVC) === "degree";
                    })() && (
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
                        <label className="flex items-center space-x-2 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disclosureOptions.gpa}
                            onChange={(e) =>
                              setDisclosureOptions({
                                ...disclosureOptions,
                                gpa: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            GPAを開示
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
                disabled={proofStatus === "generating" || !selectedVCForProof}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-offset-2"
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
                  <span className="flex items-center justify-center space-x-2">
                    <span>🔐</span>
                    <span>ゼロ知識証明を生成</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 証明結果 */}
          {(proofStatus === "success" || proofStatus === "verified") &&
            proofData && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      証明が生成されました
                    </h2>
                  </div>
                  {/* 検証済みステータス */}
                  {proofData.verifyResult?.verified && (
                    <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border-2 border-green-200 rounded-xl">
                      <span className="text-green-600 font-bold">✅</span>
                      <span className="text-green-700 font-semibold">
                        検証済み
                      </span>
                      {proofData.verifyResult.verifiedAt && (
                        <span className="text-xs text-green-600 ml-2">
                          (
                          {new Date(
                            proofData.verifyResult.verifiedAt
                          ).toLocaleDateString("ja-JP")}
                          )
                        </span>
                      )}
                    </div>
                  )}
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

                      {/* 設定した条件 */}
                      {proofData.conditions && proofData.usedVCs && (
                        <div>
                          <span className="text-gray-600 font-semibold">
                            設定した条件:
                          </span>
                          <div className="mt-2 p-3 bg-white rounded-lg border">
                            {/* TOEIC条件（TOEIC VCが使用された場合のみ表示） */}
                            {proofData.usedVCs.some(
                              (vc) => vc.type === "toeic"
                            ) &&
                              proofData.conditions.minToeicScore > 0 && (
                                <div className="text-gray-900">
                                  最小TOEICスコア:{" "}
                                  {proofData.conditions.minToeicScore}点以上
                                </div>
                              )}
                            {/* 学位条件（学位VCが使用された場合のみ表示） */}
                            {proofData.usedVCs.some(
                              (vc) => vc.type === "degree"
                            ) && (
                              <div className="text-gray-900">
                                最小GPA:{" "}
                                {proofData.conditions.minGpa > 0
                                  ? `${proofData.conditions.minGpa}以上`
                                  : "チェックなし（学位証明書VCの存在のみ証明）"}
                              </div>
                            )}
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

                      {/* 生成された証明 */}
                      {proofData.proofs && (
                        <div>
                          <span className="text-gray-600 font-semibold">
                            生成された証明:
                          </span>
                          <div className="mt-2 space-y-2">
                            {proofData.proofs.map((proof, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-indigo-50 rounded-lg border border-indigo-200"
                              >
                                <span className="text-indigo-800 font-medium">
                                  🔐{" "}
                                  {proof.type === "age"
                                    ? "年齢証明"
                                    : proof.type === "toeic"
                                    ? "TOEIC証明"
                                    : proof.type}
                                </span>
                                <p className="text-xs text-indigo-600 mt-1">
                                  証明が正常に生成されました
                                </p>
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
                                    <span className="font-semibold">
                                      {key}:
                                    </span>{" "}
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
                  {!proofData.verifyResult && (
                    <button
                      onClick={handleVerifyProof}
                      disabled={proofStatus === "verifying"}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2"
                    >
                      {proofStatus === "verifying" ? (
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
                          <span>検証中...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center space-x-2">
                          <span>🔍</span>
                          <span>証明を検証する</span>
                        </span>
                      )}
                    </button>
                  )}

                  {/* 検証結果 */}
                  {proofData.verifyResult && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            proofData.verifyResult.verified
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          <span className="text-2xl">
                            {proofData.verifyResult.verified ? "✅" : "❌"}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {proofData.verifyResult.verified
                            ? "検証成功"
                            : "検証失敗"}
                        </h3>
                      </div>

                      {proofData.verifyResult.error ? (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-red-800 font-semibold mb-2">
                            エラーが発生しました
                          </p>
                          <p className="text-red-700 text-sm">
                            {proofData.verifyResult.error}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-4 bg-white rounded-lg border border-green-200">
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>検証結果:</strong>
                            </p>
                            <div className="space-y-2">
                              {proofData.verifyResult.results.map(
                                (result, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-lg border ${
                                      result.verified
                                        ? "bg-green-50 border-green-200"
                                        : "bg-red-50 border-red-200"
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">
                                        {result.verified ? "✅" : "❌"}
                                      </span>
                                      <span
                                        className={`font-semibold ${
                                          result.verified
                                            ? "text-green-800"
                                            : "text-red-800"
                                        }`}
                                      >
                                        {result.type === "age"
                                          ? "年齢証明"
                                          : result.type === "toeic"
                                          ? "TOEIC証明"
                                          : result.type === "degree"
                                          ? "学位証明"
                                          : result.type}
                                      </span>
                                      <span
                                        className={`text-sm ${
                                          result.verified
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {result.skipped
                                          ? result.message || "スキップ"
                                          : result.verified
                                          ? "検証成功"
                                          : "検証失敗"}
                                      </span>
                                    </div>
                                    {result.message && result.skipped && (
                                      <p className="text-xs text-gray-600 mt-1 ml-7">
                                        {result.message}
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {proofData.verifyResult.verifiedAt && (
                            <p className="text-xs text-gray-500 text-right">
                              検証日時:{" "}
                              {new Date(
                                proofData.verifyResult.verifiedAt
                              ).toLocaleString("ja-JP")}
                            </p>
                          )}

                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>💡 検証の意味:</strong>
                              <br />
                              この検証により、生成されたゼロ知識証明（ZKP）が数学的に正しいことが確認されました。
                              <br />
                              <br />
                              <strong>検証内容:</strong>
                              <br />
                              • ZKP証明の数学的正しさ: ✅
                              検証済み（snarkjs.groth16.verify）
                              <br />
                              • VC自体の署名検証: ❌
                              未実装（proofフィールドなし）
                              <br />
                              <br />
                              <span className="text-xs text-gray-600">
                                ※
                                現在の実装では、VCが改ざんされていても検出できません。
                                プロダクション環境では、VCの署名検証（proofフィールド）の実装が必須です。
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* エクスポート機能（検証済みの場合のみ表示） */}
                      {proofData.verifyResult?.verified && (
                        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                          <h4 className="font-bold text-indigo-900 mb-3">
                            📤 証明データをダウンロード
                          </h4>
                          <p className="text-sm text-indigo-800 mb-3">
                            検証済みのZKP証明をファイルとしてダウンロードできます。メッセージやイベント応募時に添付して使用できます。
                          </p>
                          <div className="space-y-3">
                            {/* ファイルとしてダウンロード */}
                            <button
                              onClick={() => {
                                // 証明データをJSON形式でエクスポート
                                const exportData = {
                                  ...proofData,
                                  exportedAt: new Date().toISOString(),
                                  version: "1.0",
                                };
                                const jsonStr = JSON.stringify(
                                  exportData,
                                  null,
                                  2
                                );
                                const blob = new Blob([jsonStr], {
                                  type: "application/json",
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `zkp-proof-${
                                  proofData.proofHash?.slice(0, 16) ||
                                  Date.now()
                                }.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                alert("証明データをダウンロードしました。");
                              }}
                              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium text-sm transition-colors shadow-md hover:shadow-lg"
                            >
                              📥 証明データをダウンロード
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setProofData({
                            ...proofData,
                            verifyResult: undefined,
                          });
                        }}
                        className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm transition-colors"
                      >
                        検証結果を閉じる
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
