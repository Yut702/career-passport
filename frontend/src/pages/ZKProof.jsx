import { useState } from "react";
import StudentLayout from "../components/StudentLayout";

export default function ZKProof() {
  const [proofStatus, setProofStatus] = useState("idle"); // idle, generating, success, error
  const [proofData, setProofData] = useState(null);

  const handleGenerateProof = async () => {
    setProofStatus("generating");
    // モック: ゼロ知識証明の生成
    setTimeout(() => {
      setProofData({
        proof: "0x1234567890abcdef...",
        publicInputs: ["0xabc", "0xdef"],
        timestamp: new Date().toISOString(),
      });
      setProofStatus("success");
    }, 2000);
  };

  const handleVerifyProof = async () => {
    if (!proofData) return;
    setProofStatus("generating");
    // モック: 証明の検証
    setTimeout(() => {
      setProofStatus("success");
    }, 1000);
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ヘッダー */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🔐</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">ゼロ知識証明</h1>
            <p className="text-gray-600 mt-1">プライバシーを保護しながら証明を生成</p>
          </div>
        </div>

        {/* 説明カード */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ゼロ知識証明とは？</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              ゼロ知識証明（Zero-Knowledge Proof）を使用することで、以下の情報を公開せずに証明できます：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>スタンプの詳細情報（企業名、発行日など）</li>
              <li>個人情報</li>
              <li>ウォレットアドレス</li>
            </ul>
            <p className="mt-4 font-semibold">
              証明したい内容だけを検証者に示し、その他の情報は秘匿したまま証明できます。
            </p>
          </div>
        </div>

        {/* 証明生成セクション */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">証明の生成</h2>
          
          <div className="space-y-6">
            {/* 証明内容の選択 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                証明したい内容
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input type="checkbox" className="w-5 h-5 text-indigo-600" defaultChecked />
                  <span className="text-gray-700">3つ以上のスタンプを所有している</span>
                </label>
                <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input type="checkbox" className="w-5 h-5 text-indigo-600" />
                  <span className="text-gray-700">特定の企業からスタンプを取得している</span>
                </label>
                <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input type="checkbox" className="w-5 h-5 text-indigo-600" />
                  <span className="text-gray-700">NFT証明書を所有している</span>
                </label>
              </div>
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
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Proof:</span>
                    <div className="mt-1 p-3 bg-white rounded-lg font-mono text-xs break-all">
                      {proofData.proof}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Public Inputs:</span>
                    <div className="mt-1 p-3 bg-white rounded-lg font-mono text-xs">
                      {proofData.publicInputs.join(", ")}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">生成日時:</span>
                    <div className="mt-1 text-gray-700">
                      {new Date(proofData.timestamp).toLocaleString("ja-JP")}
                    </div>
                  </div>
                </div>
              </div>

              {/* 検証ボタン */}
              <button
                onClick={handleVerifyProof}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                🔍 証明を検証する
              </button>

              {/* 共有ボタン */}
              <div className="flex space-x-4">
                <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition border-2 border-gray-200">
                  📤 証明を共有
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition border-2 border-gray-200">
                  💾 証明を保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 使用例 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">使用例</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">就職活動での活用</h3>
              <p className="text-blue-800">
                企業に「3つ以上のスタンプを所有している」ことを証明できます。
                どの企業から取得したかなどの詳細情報は公開せずに証明可能です。
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <h3 className="font-bold text-purple-900 mb-2">プライバシー保護</h3>
              <p className="text-purple-800">
                ウォレットアドレスや個人情報を公開することなく、
                必要な証明だけを提示できます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

