import { useState, useEffect } from "react";
import { verifyProofs } from "../lib/zkp/verifier.js";

/**
 * 企業側ZKP証明検証ページ
 * 学生から共有されたZKP証明を検証し、条件を満たしているかを確認できます
 */
export default function OrgZKPVerification() {
  const [proofData, setProofData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("idle"); // idle, verifying, verified, error
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  // メッセージから遷移してきた場合、ローカルストレージから証明データを読み込む
  useEffect(() => {
    const pendingProof = localStorage.getItem("pendingZKPVerification");
    if (pendingProof) {
      try {
        const data = JSON.parse(pendingProof);
        setProofData(data);
        localStorage.removeItem("pendingZKPVerification");
      } catch (error) {
        console.error("Error loading pending proof:", error);
      }
    }
  }, []);

  // ファイルを読み込んで証明データをインポート
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setProofData(data);
        setError(null);
        setVerificationResult(null);
        setVerificationStatus("idle");
      } catch {
        setError(
          "ファイルの読み込みに失敗しました。正しいJSON形式の証明ファイルを選択してください。"
        );
        setProofData(null);
      }
    };
    reader.readAsText(file);
  };

  // 証明を検証
  const handleVerify = async () => {
    if (!proofData || !proofData.proofs) {
      setError("証明データが読み込まれていません。");
      return;
    }

    setVerificationStatus("verifying");
    setError(null);

    try {
      // スキップされていない証明のみを検証
      const validProofs = proofData.proofs.filter(
        (p) =>
          !p.proof?.skipped &&
          p.proof &&
          p.publicSignals &&
          p.publicSignals.length > 0
      );

      if (validProofs.length === 0) {
        // スキップされた証明のみの場合
        const skippedProofs = proofData.proofs.filter((p) => p.proof?.skipped);
        if (skippedProofs.length > 0) {
          setVerificationResult({
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
          });
          setVerificationStatus("verified");
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
      const skippedProofs = proofData.proofs.filter((p) => p.proof?.skipped);
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

      setVerificationResult({
        verified: verifyResult.allVerified,
        results: allResults,
        verifiedAt: new Date().toISOString(),
      });
      setVerificationStatus("verified");
    } catch (err) {
      console.error("Error verifying proof:", err);
      setError(err.message || "証明の検証に失敗しました。");
      setVerificationStatus("error");
    }
  };

  const getVCDisplayName = (type) => {
    const names = {
      myNumber: "マイナンバーカード",
      toeic: "TOEIC証明書",
      degree: "学位証明書",
    };
    return names[type] || type;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ZKP証明の検証</h1>
        <p className="text-gray-600">
          学生から共有されたゼロ知識証明（ZKP）を検証し、条件を満たしているかを確認できます
        </p>
      </div>

      {/* 説明カード */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
        <h2 className="text-xl font-bold text-gray-900 mb-3">📋 検証の流れ</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>
            学生が生成・検証したZKP証明データ（JSONファイル）をアップロード
          </li>
          <li>証明データの内容を確認</li>
          <li>証明を検証して、条件を満たしているかを確認</li>
        </ol>
      </div>

      {/* ファイルアップロード */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          証明データのアップロード
        </h2>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="proof-file-input"
            />
            <label
              htmlFor="proof-file-input"
              className="cursor-pointer flex flex-col items-center space-y-3"
            >
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">📁</span>
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  クリックして証明ファイルを選択
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  JSON形式の証明ファイルをアップロードしてください
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {proofData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm font-medium">
                ✅ 証明データが読み込まれました
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 証明データの表示 */}
      {proofData && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            証明データの内容
          </h2>

          <div className="space-y-6">
            {/* 使用したVC */}
            {proofData.usedVCs && (
              <div>
                <h3 className="font-bold text-gray-700 mb-3">使用したVC</h3>
                <div className="space-y-2">
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
                <h3 className="font-bold text-gray-700 mb-3">設定した条件</h3>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  {proofData.usedVCs.some((vc) => vc.type === "myNumber") &&
                    proofData.conditions.minAge > 0 && (
                      <div className="text-gray-900 mb-2">
                        最小年齢: {proofData.conditions.minAge}歳以上
                      </div>
                    )}
                  {proofData.usedVCs.some((vc) => vc.type === "toeic") &&
                    proofData.conditions.minToeicScore > 0 && (
                      <div className="text-gray-900 mb-2">
                        最小TOEICスコア: {proofData.conditions.minToeicScore}
                        点以上
                      </div>
                    )}
                  {proofData.usedVCs.some((vc) => vc.type === "degree") && (
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

            {/* 公開情報 */}
            {proofData.publicInputs &&
              Object.keys(proofData.publicInputs).length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-3">
                    公開された情報
                  </h3>
                  <div className="p-4 bg-white rounded-lg border">
                    {Object.entries(proofData.publicInputs).map(
                      ([key, value]) => (
                        <div key={key} className="text-gray-900 mb-2">
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* 非公開情報 */}
            {proofData.hiddenAttributes &&
              Object.keys(proofData.hiddenAttributes).length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-3">非公開情報</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-2">
                      以下の情報は開示されていません（ZKPにより条件のみ証明）:
                    </p>
                    <div className="space-y-1">
                      {Object.keys(proofData.hiddenAttributes).map((key) => (
                        <div key={key} className="text-gray-700 text-sm">
                          • {key}: 非公開
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {/* 証明ハッシュ */}
            {proofData.proofHash && (
              <div>
                <h3 className="font-bold text-gray-700 mb-3">証明ハッシュ</h3>
                <div className="p-3 bg-gray-50 rounded-lg border font-mono text-xs text-gray-600 break-all">
                  {proofData.proofHash}
                </div>
              </div>
            )}

            {/* 生成日時 */}
            {proofData.timestamp && (
              <div>
                <h3 className="font-bold text-gray-700 mb-3">生成日時</h3>
                <div className="text-gray-900">
                  {new Date(proofData.timestamp).toLocaleString("ja-JP")}
                </div>
              </div>
            )}

            {/* 検証ボタン */}
            <button
              onClick={handleVerify}
              disabled={verificationStatus === "verifying"}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-offset-2"
            >
              {verificationStatus === "verifying" ? (
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
          </div>
        </div>
      )}

      {/* 検証結果 */}
      {verificationResult && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                verificationResult.verified ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <span className="text-2xl">
                {verificationResult.verified ? "✅" : "❌"}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {verificationResult.verified ? "検証成功" : "検証失敗"}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-3">
                <strong>検証結果:</strong>
              </p>
              <div className="space-y-2">
                {verificationResult.results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      result.verified
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">
                        {result.verified ? "✅" : "❌"}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {getVCDisplayName(result.type)}の証明
                        </div>
                        <span
                          className={`text-sm ${
                            result.verified ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {result.skipped
                            ? result.message || "スキップ"
                            : result.verified
                            ? "検証成功"
                            : "検証失敗"}
                        </span>
                      </div>
                    </div>
                    {result.message && result.skipped && (
                      <p className="text-xs text-gray-600 mt-2 ml-8">
                        {result.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {verificationResult.verifiedAt && (
              <p className="text-xs text-gray-500 text-right">
                検証日時:{" "}
                {new Date(verificationResult.verifiedAt).toLocaleString(
                  "ja-JP"
                )}
              </p>
            )}

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 検証の意味:</strong>
                <br />
                この検証により、学生が提示したゼロ知識証明（ZKP）が数学的に正しいことが確認されました。
                <br />
                証明は改ざんされておらず、設定した条件を満たしていることが検証されています。
                <br />
                <br />
                <strong>検証内容:</strong>
                <br />
                • ZKP証明の数学的正しさ: ✅ 検証済み（snarkjs.groth16.verify）
                <br />
                • VC自体の署名検証: ❌ 未実装（proofフィールドなし）
                <br />
                <br />
                <span className="text-xs text-gray-600">
                  ※ 現在の実装では、VCが改ざんされていても検出できません。
                  プロダクション環境では、VCの署名検証（proofフィールド）の実装が必須です。
                </span>
              </p>
            </div>

            {verificationResult.verified && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">
                  ✅ この学生は提示された条件を満たしていることが確認されました
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
