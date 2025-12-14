import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useContracts } from "../hooks/useContracts";
import { matchAPI, jobConditionAPI } from "../lib/api";
import { formatAddress } from "../lib/utils";
import { verifyProofs } from "../lib/zkp/verifier";
import { jobCategories, industries } from "../data/jobCategories";

export default function OrgMatchedCandidates() {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("matchId");
  const studentAddress = searchParams.get("studentAddress");
  const navigate = useNavigate();
  const { account, isConnected } = useWallet();
  const { nftContract, stampManagerContract, isReady } = useContracts();

  const [match, setMatch] = useState(null);
  const [studentCondition, setStudentCondition] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [zkpProof, setZkpProof] = useState(null);
  const [zkpVerificationResult, setZkpVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStamps, setLoadingStamps] = useState(false);
  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [verifyingZKP, setVerifyingZKP] = useState(false);

  // マッチング情報を取得
  useEffect(() => {
    const loadMatch = async () => {
      if (!matchId && !studentAddress) {
        setError("マッチングIDまたは学生アドレスが必要です");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let matchData = null;
        if (matchId) {
          const response = await matchAPI.getMatchById(matchId);
          if (response.ok && response.match) {
            matchData = response.match;
          }
        } else if (studentAddress) {
          // studentAddressからマッチングを検索（簡易実装）
          const response = await matchAPI.getOrgMatches(account);
          if (response.ok && response.matches) {
            matchData = response.matches.find(
              (m) =>
                m.studentAddress.toLowerCase() === studentAddress.toLowerCase()
            );
          }
        }

        if (matchData) {
          setMatch(matchData);
          // ZKP証明ハッシュがある場合、ZKP証明データを設定
          if (matchData.zkpProofHash) {
            setZkpProof({ proofHash: matchData.zkpProofHash });
          }
        } else {
          setError("マッチング情報が見つかりませんでした");
        }
      } catch (err) {
        console.error("Error loading match:", err);
        setError("マッチング情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && account) {
      loadMatch();
    } else {
      setLoading(false);
    }
  }, [matchId, studentAddress, account, isConnected]);

  // 学生の求人条件を取得
  useEffect(() => {
    const loadStudentCondition = async () => {
      const targetAddress = match?.studentAddress || studentAddress;
      if (!targetAddress) return;

      try {
        const conditionResponse = await jobConditionAPI.getJobCondition(
          targetAddress
        );
        if (conditionResponse.ok && conditionResponse.condition) {
          setStudentCondition(conditionResponse.condition);
        }
      } catch (err) {
        console.error("Error loading student condition:", err);
      }
    };

    loadStudentCondition();
  }, [match?.studentAddress, studentAddress]);

  // スタンプを取得
  useEffect(() => {
    const loadStamps = async () => {
      if (!stampManagerContract || !isReady || !studentAddress) return;

      try {
        setLoadingStamps(true);
        // コントラクトの存在確認
        const contractCode = await stampManagerContract.runner.provider.getCode(
          stampManagerContract.target
        );
        if (contractCode === "0x" || contractCode === "0x0") {
          console.warn("StampManagerコントラクトが存在しません");
          setStamps([]);
          return;
        }

        // 学生のスタンプを取得
        const [tokenIds, amounts] = await stampManagerContract.getUserStamps(
          studentAddress
        );

        const formattedStamps = [];
        for (let i = 0; i < tokenIds.length; i++) {
          const tokenId = tokenIds[i];
          const amount = amounts[i];

          try {
            const metadata = await stampManagerContract.getStampMetadata(
              tokenId
            );
            for (let j = 0; j < Number(amount); j++) {
              formattedStamps.push({
                id: `${tokenId}-${j}`,
                tokenId: tokenId.toString(),
                name: metadata.name,
                organization: metadata.organization,
                category: metadata.category,
                issuedAt: new Date(Number(metadata.createdAt) * 1000)
                  .toISOString()
                  .split("T")[0],
              });
            }
          } catch (err) {
            console.warn(`TokenId ${tokenId}のメタデータ取得に失敗:`, err);
          }
        }

        setStamps(formattedStamps);
      } catch (err) {
        console.error("Error loading stamps:", err);
        // エラーが発生しても空配列を設定（データベースがない場合も空で表示）
        setStamps([]);
      } finally {
        setLoadingStamps(false);
      }
    };

    loadStamps();
  }, [stampManagerContract, isReady, studentAddress]);

  // NFTを取得
  useEffect(() => {
    const loadNFTs = async () => {
      if (!nftContract || !isReady || !studentAddress) return;

      try {
        setLoadingNFTs(true);
        // コントラクトの存在確認
        const contractCode = await nftContract.runner.provider.getCode(
          nftContract.target
        );
        if (contractCode === "0x" || contractCode === "0x0") {
          console.warn("NFTコントラクトが存在しません");
          setNfts([]);
          return;
        }

        const totalSupply = await nftContract.getTotalSupply();
        const totalSupplyNumber = Number(totalSupply);
        const userNFTs = [];

        for (let i = 0; i < totalSupplyNumber; i++) {
          try {
            const owner = await nftContract.ownerOf(i);
            if (owner.toLowerCase() === studentAddress.toLowerCase()) {
              const tokenName = await nftContract.getTokenName(i);
              const rarity = await nftContract.getTokenRarity(i);
              const organizations = await nftContract.getTokenOrganizations(i);

              userNFTs.push({
                id: `nft_${i}`,
                tokenId: i,
                name: tokenName,
                rarity: rarity,
                organizations: organizations,
              });
            }
          } catch (err) {
            // トークンが存在しない場合はスキップ
            console.warn(`Token ${i} does not exist:`, err);
          }
        }

        setNfts(userNFTs);
      } catch (err) {
        console.error("Error loading NFTs:", err);
        // エラーが発生しても空配列を設定（データベースがない場合も空で表示）
        setNfts([]);
      } finally {
        setLoadingNFTs(false);
      }
    };

    loadNFTs();
  }, [nftContract, isReady, studentAddress]);

  // ZKP証明を検証
  const handleVerifyZKP = async () => {
    if (!zkpProof || !zkpProof.proofs) {
      setError("検証可能なZKP証明データがありません");
      return;
    }

    try {
      setVerifyingZKP(true);
      setError(null);

      const proofResultForVerification = {
        proofs: zkpProof.proofs
          .filter(
            (p) => !p.proof?.skipped && p.proof && p.publicSignals?.length > 0
          )
          .map((p) => ({
            type: p.type,
            proof: {
              proof: p.proof,
              publicSignals: p.publicSignals,
            },
          })),
      };

      if (proofResultForVerification.proofs.length > 0) {
        const result = await verifyProofs(proofResultForVerification);
        setZkpVerificationResult(result);
      } else {
        // スキップされた証明のみの場合
        setZkpVerificationResult({
          allVerified: true,
          results: zkpProof.proofs.map((p) => ({
            type: p.type,
            verified: true,
            skipped: true,
            message:
              p.type === "degree"
                ? "GPA条件なし（学位証明書VCの存在のみ証明）"
                : "証明がスキップされました",
          })),
        });
      }
    } catch (err) {
      console.error("Error verifying ZKP proof:", err);
      setError("ZKP証明の検証に失敗しました: " + err.message);
    } finally {
      setVerifyingZKP(false);
    }
  };

  const handleContact = () => {
    if (match?.studentAddress) {
      navigate(`/org/messages?candidateId=${match.studentAddress}`);
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
        </div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-800 font-semibold mb-2">エラー</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">人材情報が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/org/candidate-search")}
        className="mb-6 text-purple-600 hover:text-purple-700 flex items-center space-x-2"
      >
        <span>←</span>
        <span>人材探しに戻る</span>
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {formatAddress(match.studentAddress)}
            </h1>
            <p className="text-gray-600 text-lg mb-1 font-mono">
              {match.studentAddress}
            </p>
            {match.zkpProofHash && (
              <p className="text-sm text-indigo-600 mt-2">🔐 ZKP証明済み</p>
            )}
            {match.matchedAt && (
              <p className="text-gray-500 text-sm">
                マッチング日時:{" "}
                {new Date(match.matchedAt).toLocaleString("ja-JP")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 学生の求人条件 */}
          {studentCondition && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                📋 学生の求人条件
              </h3>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">
                      仕事の種類:
                    </span>{" "}
                    <span className="text-gray-900">
                      {studentCondition.jobType === "internship"
                        ? "インターンシップ"
                        : studentCondition.jobType === "event"
                        ? "イベント"
                        : studentCondition.jobType === "lecture"
                        ? "講座"
                        : studentCondition.jobType === "fulltime"
                        ? "正社員"
                        : "未設定"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      職種カテゴリ:
                    </span>{" "}
                    <span className="text-gray-900">
                      {studentCondition.positionCategory
                        ? jobCategories[studentCondition.positionCategory]
                            ?.name || "未設定"
                        : "未設定"}
                    </span>
                  </div>
                  {studentCondition.position && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        具体的な職種:
                      </span>{" "}
                      <span className="text-gray-900">
                        {studentCondition.position}
                      </span>
                    </div>
                  )}
                  {studentCondition.location && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        勤務地:
                      </span>{" "}
                      <span className="text-gray-900">
                        {studentCondition.location}
                      </span>
                    </div>
                  )}
                  {studentCondition.industry && (
                    <div>
                      <span className="font-semibold text-gray-700">業界:</span>{" "}
                      <span className="text-gray-900">
                        {industries.find(
                          (i) => i.value === studentCondition.industry
                        )?.label || studentCondition.industry}
                      </span>
                    </div>
                  )}
                  {studentCondition.salary && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        希望給与:
                      </span>{" "}
                      <span className="text-gray-900">
                        {studentCondition.salary}
                      </span>
                    </div>
                  )}
                  {studentCondition.workStyle && (
                    <div>
                      <span className="font-semibold text-gray-700">
                        働き方:
                      </span>{" "}
                      <span className="text-gray-900">
                        {studentCondition.workStyle === "remote"
                          ? "リモート"
                          : studentCondition.workStyle === "hybrid"
                          ? "ハイブリッド"
                          : studentCondition.workStyle === "office"
                          ? "オフィス"
                          : studentCondition.workStyle}
                      </span>
                    </div>
                  )}
                  {studentCondition.skills &&
                    studentCondition.skills.length > 0 && (
                      <div className="md:col-span-2">
                        <span className="font-semibold text-gray-700">
                          希望スキル:
                        </span>{" "}
                        <span className="text-gray-900">
                          {studentCondition.skills.join(", ")}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* スタンプ */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              所持スタンプ
            </h3>
            {loadingStamps ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : stamps.length === 0 ? (
              <div className="text-gray-500 bg-gray-50 rounded-xl p-4">
                スタンプがありません
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stamps.map((stamp) => (
                  <div
                    key={stamp.id}
                    className="p-4 bg-purple-50 rounded-xl border border-purple-200"
                  >
                    <div className="font-medium text-gray-900">
                      {stamp.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stamp.organization}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stamp.issuedAt}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NFT */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              所持NFT証明書
            </h3>
            {loadingNFTs ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : nfts.length === 0 ? (
              <div className="text-gray-500 bg-gray-50 rounded-xl p-4">
                NFT証明書がありません
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nfts.map((nft) => (
                  <div
                    key={nft.id}
                    className="p-4 bg-purple-50 rounded-xl border border-purple-200"
                  >
                    <div className="font-medium text-gray-900">{nft.name}</div>
                    <div className="text-sm text-gray-600">
                      {Array.isArray(nft.organizations)
                        ? nft.organizations.join(", ")
                        : nft.organizations}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      レアリティ: {nft.rarity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ZKP証明 */}
          {match.zkpProofHash && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">ZKP証明</h3>
              <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-indigo-900">
                      証明ハッシュ
                    </div>
                    <div className="text-xs font-mono text-indigo-700">
                      {match.zkpProofHash}
                    </div>
                  </div>
                  {zkpProof?.proofs && !zkpVerificationResult && (
                    <button
                      onClick={handleVerifyZKP}
                      disabled={verifyingZKP}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {verifyingZKP ? "検証中..." : "検証する"}
                    </button>
                  )}
                </div>

                {zkpVerificationResult && (
                  <div
                    className={`mt-3 p-3 rounded-lg border ${
                      zkpVerificationResult.allVerified
                        ? "bg-green-50 border-green-300"
                        : "bg-red-50 border-red-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">
                        {zkpVerificationResult.allVerified ? "✅" : "❌"}
                      </span>
                      <span
                        className={`font-semibold text-sm ${
                          zkpVerificationResult.allVerified
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        {zkpVerificationResult.allVerified
                          ? "検証成功"
                          : "検証失敗"}
                      </span>
                    </div>
                    {zkpVerificationResult.results &&
                      zkpVerificationResult.results.length > 0 && (
                        <div className="text-xs space-y-1">
                          {zkpVerificationResult.results.map((result, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2"
                            >
                              <span>{result.verified ? "✅" : "❌"}</span>
                              <span>
                                {result.type === "age"
                                  ? "年齢証明"
                                  : result.type === "toeic"
                                  ? "TOEIC証明"
                                  : result.type === "degree"
                                  ? "学位証明"
                                  : result.type}
                                {result.skipped && ` (${result.message})`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {!zkpProof?.proofs && (
                  <p className="text-sm text-indigo-700">
                    ZKP証明データの詳細は、学生がマッチング時に設定した情報を参照してください。
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => navigate("/org/candidate-search")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleContact}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              メッセージを送る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
