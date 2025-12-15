import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWalletConnect } from "../hooks/useWalletConnect";
import { useContracts } from "../hooks/useContracts";
import { matchAPI, jobConditionAPI, zkpProofAPI } from "../lib/api";
import { formatAddress } from "../lib/utils";
import { verifyProofs } from "../lib/zkp/verifier";
import { jobCategories, industries } from "../data/jobCategories";

export default function OrgMatchedCandidates() {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("matchId");
  const studentAddress = searchParams.get("studentAddress");
  const navigate = useNavigate();
  const { account, isConnected } = useWalletConnect();
  const { nftContract, stampManagerContract, isReady } = useContracts();

  const [match, setMatch] = useState(null);
  const [studentCondition, setStudentCondition] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [zkpProof, setZkpProof] = useState(null);
  const [zkpVerificationResult, setZkpVerificationResult] = useState(null);
  const [zkpConditions, setZkpConditions] = useState([]); // ユーザーが設定したZKP条件
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStamps, setLoadingStamps] = useState(false);
  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [verifyingZKP, setVerifyingZKP] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false); // マッチング作成中フラグ

  // マッチング情報を取得
  useEffect(() => {
    console.log("[OrgMatchedCandidates] useEffect実行:", {
      matchId,
      studentAddress,
      account,
      isConnected,
    });

    const loadMatch = async () => {
      console.log("[OrgMatchedCandidates] loadMatch開始:", {
        matchId,
        studentAddress,
        account,
      });

      if (!matchId && !studentAddress) {
        console.warn(
          "[OrgMatchedCandidates] matchIdとstudentAddressの両方がありません"
        );
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
          console.log("[OrgMatchedCandidates] マッチング検索開始:", {
            studentAddress,
            account,
          });
          const response = await matchAPI.getOrgMatches(account);
          console.log("[OrgMatchedCandidates] マッチング検索結果:", {
            ok: response.ok,
            matchesCount: response.matches?.length || 0,
            matches: response.matches,
          });
          if (response.ok && response.matches) {
            matchData = response.matches.find(
              (m) =>
                m.studentAddress.toLowerCase() === studentAddress.toLowerCase()
            );
            console.log("[OrgMatchedCandidates] 該当マッチング:", matchData);
          } else {
            console.warn(
              "[OrgMatchedCandidates] マッチング検索失敗またはマッチングなし:",
              response
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
          // マッチングが存在しない場合でも、エラーではなく情報として扱う
          // 学生の情報は引き続き表示できるようにする
          console.log(
            "[OrgMatchedCandidates] マッチングが見つかりませんでしたが、学生情報は表示します"
          );
          setError(null); // エラーをクリア（学生情報は表示可能）
        }
      } catch (err) {
        console.error("Error loading match:", err);
        setError("マッチング情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && account) {
      console.log(
        "[OrgMatchedCandidates] 条件満たしたためloadMatchを実行します"
      );
      loadMatch();
    } else {
      console.warn("[OrgMatchedCandidates] 条件未満足:", {
        isConnected,
        account,
      });
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

          // ZKP条件を取得（selectedZKPProofsがある場合）
          if (
            conditionResponse.condition.selectedZKPProofs &&
            conditionResponse.condition.selectedZKPProofs.length > 0
          ) {
            const zkpConditionsData = [];
            const seenProofIds = new Set(); // 重複チェック用

            for (const proofId of conditionResponse.condition
              .selectedZKPProofs) {
              // 既に処理したproofIdはスキップ（重複除去）
              if (seenProofIds.has(proofId)) {
                console.log(`ZKP証明 ${proofId} は既に処理済みのためスキップ`);
                continue;
              }

              try {
                const zkpResponse = await zkpProofAPI.getZKPProofById(proofId);
                if (zkpResponse.ok && zkpResponse.proof) {
                  seenProofIds.add(proofId);
                  zkpConditionsData.push(zkpResponse.proof);
                } else {
                  // 証明が見つからない場合は警告のみ（エラーにはしない）
                  console.warn(
                    `ZKP証明 ${proofId} が見つかりませんでした（スキップ）`
                  );
                }
              } catch (err) {
                // エラーが発生しても続行（証明が見つからない場合はスキップ）
                console.warn(
                  `ZKP証明 ${proofId} の取得に失敗（スキップ）:`,
                  err.message || err
                );
              }
            }

            // さらに、proofIdが同じで内容も同じ可能性があるため、proofIdでユニークにする
            const uniqueZkpConditions = Array.from(
              new Map(
                zkpConditionsData.map((proof) => [
                  proof.proofId || JSON.stringify(proof),
                  proof,
                ])
              ).values()
            );

            setZkpConditions(uniqueZkpConditions);
          } else {
            setZkpConditions([]);
          }
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
            const stampName = Array.isArray(metadata)
              ? metadata[0]
              : metadata.name;
            const stampOrganization = Array.isArray(metadata)
              ? metadata[1]
              : metadata.organization;
            const stampCategory = Array.isArray(metadata)
              ? metadata[2]
              : metadata.category;
            const stampCreatedAt = Array.isArray(metadata)
              ? metadata[3]
              : metadata.createdAt;
            const stampImageType = Array.isArray(metadata)
              ? metadata[5] !== undefined
                ? Number(metadata[5])
                : 0
              : metadata.imageType !== undefined
              ? Number(metadata.imageType)
              : 0;

            for (let j = 0; j < Number(amount); j++) {
              formattedStamps.push({
                id: `${tokenId}-${j}`,
                tokenId: tokenId.toString(),
                name: stampName,
                organization: stampOrganization,
                category: stampCategory,
                issuedAt: new Date(Number(stampCreatedAt) * 1000)
                  .toISOString()
                  .split("T")[0],
                imageType: stampImageType,
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

        let totalSupply = 0;
        let totalSupplyNumber = 0;
        try {
          totalSupply = await nftContract.getTotalSupply();
          totalSupplyNumber = Number(totalSupply);
        } catch (err) {
          // コントラクトが存在しない、またはデータが存在しない場合は0として扱う
          if (
            err.code === "BAD_DATA" ||
            err.message?.includes("could not decode result data") ||
            err.message?.includes('value="0x"')
          ) {
            // 初期状態として扱う（エラーを表示しない）
            totalSupplyNumber = 0;
          } else {
            console.warn("getTotalSupply: エラー", err);
          }
        }
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
    const targetAddress = match?.studentAddress || studentAddress;
    if (targetAddress) {
      navigate(`/org/messages?candidateId=${targetAddress}`);
    }
  };

  /**
   * マッチングを作成
   */
  const handleCreateMatch = async () => {
    if (!studentAddress || !account) {
      setError("学生アドレスまたは企業アドレスが設定されていません");
      return;
    }

    if (
      !window.confirm(
        "この候補者とマッチングを作成しますか？\nマッチング作成後、「メッセージを送る」ボタンからメッセージを送信できます。"
      )
    ) {
      return;
    }

    setCreatingMatch(true);
    setError(null);

    try {
      const response = await matchAPI.create(studentAddress, account);
      if (response.ok && response.match) {
        setMatch(response.match);
        alert(
          "マッチングを作成しました！\n「メッセージを送る」ボタンからメッセージを送信できます。"
        );
        // ページをリロードせず、マッチング状態を更新するだけ
        // window.location.reload();
      } else {
        throw new Error(response.error || "マッチングの作成に失敗しました");
      }
    } catch (err) {
      console.error("Error creating match:", err);
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("409")
      ) {
        setError("この候補者とは既にマッチングが存在します");
      } else {
        setError("マッチングの作成に失敗しました: " + err.message);
      }
    } finally {
      setCreatingMatch(false);
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

  // マッチングが存在しない場合でも、学生アドレスがあれば情報を表示
  const displayStudentAddress = match?.studentAddress || studentAddress;

  // 学生アドレスがない場合はエラー表示
  if (!displayStudentAddress) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-800 font-semibold mb-2">エラー</p>
          <p className="text-red-700 text-sm">
            学生アドレスが指定されていません
          </p>
        </div>
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

      {/* マッチングが存在しない場合の通知 */}
      {!match && studentAddress && (
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2">
                マッチングがまだ作成されていません
              </h3>
              <p className="text-sm text-yellow-800 mb-4">
                この候補者とマッチングを作成すると、メッセージのやり取りが可能になります。
              </p>
              <button
                onClick={handleCreateMatch}
                disabled={creatingMatch || !isConnected}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingMatch ? "作成中..." : "🤝 マッチングを作成"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* エラーメッセージ表示 */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-semibold mb-1">エラー</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {formatAddress(displayStudentAddress)}
            </h1>
            <p className="text-gray-600 text-lg mb-1 font-mono">
              {displayStudentAddress}
            </p>
            {match?.zkpProofHash && (
              <p className="text-sm text-indigo-600 mt-2">🔐 ZKP証明済み</p>
            )}
            {match?.matchedAt && (
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
                {/* ZKP条件の表示 */}
                {zkpConditions.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-blue-300">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">
                      🔐 VCのZKP条件
                    </h4>
                    <div className="space-y-2">
                      {zkpConditions.map((zkpCondition, index) => (
                        <div
                          key={zkpCondition.proofId || index}
                          className="bg-white rounded-lg p-3 border border-blue-200"
                        >
                          {/* 使用されたVC */}
                          {zkpCondition.usedVCs &&
                            zkpCondition.usedVCs.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold text-gray-700">
                                  使用VC:
                                </span>{" "}
                                <span className="text-xs text-gray-900">
                                  {zkpCondition.usedVCs
                                    .map((vc) => {
                                      const vcNames = {
                                        myNumber: "マイナンバー",
                                        toeic: "TOEIC",
                                        degree: "学位",
                                      };
                                      return vcNames[vc.type] || vc.type;
                                    })
                                    .join(", ")}
                                </span>
                              </div>
                            )}
                          {/* 満たした条件 */}
                          {zkpCondition.satisfiedConditions &&
                            zkpCondition.satisfiedConditions.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold text-gray-700">
                                  満たした条件:
                                </span>
                                <div className="mt-1 space-y-1">
                                  {zkpCondition.satisfiedConditions.map(
                                    (condition, idx) => {
                                      // オブジェクトの場合は適切に表示
                                      if (
                                        typeof condition === "object" &&
                                        condition !== null
                                      ) {
                                        const typeNames = {
                                          toeic: "TOEIC",
                                          degree: "学位",
                                          age: "年齢",
                                        };
                                        const typeName =
                                          typeNames[condition.type] ||
                                          condition.type;
                                        return (
                                          <div
                                            key={idx}
                                            className={`text-xs px-2 py-1 rounded ${
                                              condition.satisfied
                                                ? "bg-green-50 text-green-800 border border-green-200"
                                                : "bg-red-50 text-red-800 border border-red-200"
                                            }`}
                                          >
                                            {condition.satisfied ? "✅" : "❌"}{" "}
                                            {typeName}: {condition.condition}
                                          </div>
                                        );
                                      }
                                      // 文字列の場合はそのまま表示
                                      return (
                                        <div
                                          key={idx}
                                          className="text-xs text-gray-900 bg-gray-50 px-2 py-1 rounded"
                                        >
                                          {String(condition)}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                          {/* 公開情報 */}
                          {zkpCondition.publicInputs &&
                            Object.keys(zkpCondition.publicInputs).length >
                              0 && (
                              <div>
                                <span className="text-xs font-semibold text-gray-700">
                                  公開情報:
                                </span>
                                <div className="mt-1 space-y-1">
                                  {Object.entries(
                                    zkpCondition.publicInputs
                                  ).map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="text-xs text-gray-900"
                                    >
                                      <span className="font-medium">
                                        {key}:
                                      </span>{" "}
                                      {String(value)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
          {match?.zkpProofHash && (
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
            {match ? (
              <button
                onClick={handleContact}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                メッセージを送る
              </button>
            ) : (
              <button
                onClick={handleCreateMatch}
                disabled={creatingMatch || !isConnected}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingMatch ? "作成中..." : "🤝 マッチングを作成"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
