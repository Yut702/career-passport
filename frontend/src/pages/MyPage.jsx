import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StampCard from "../components/StampCard";
import ProgressBar from "../components/ProgressBar";
import NFTCard from "../components/NFTCard";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { storage } from "../lib/storage";

function getRpcErrorMessage(err) {
  return err?.data?.message || err?.error?.data?.message || err?.message || "";
}

function parseBlockOutOfRange(msg) {
  if (!msg) return null;
  // 複数のパターンに対応: "block height is X but requested was Y" または "BlockOutOfRangeError: block height is X but requested was Y"
  const patterns = [
    /block height is (\d+)\s+but requested was (\d+)/i,
    /BlockOutOfRangeError[:\s]+block height is (\d+)\s+but requested was (\d+)/i,
    /block height is (\d+)/i, // heightだけでも抽出
  ];

  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      const height = Number(match[1]);
      const requested = match[2] ? Number(match[2]) : null;
      if (Number.isFinite(height) && height >= 0) {
        return { height, requested };
      }
    }
  }
  return null;
}

function isBlockOutOfRangeError(err) {
  const msg = getRpcErrorMessage(err);
  return /BlockOutOfRangeError|block height/i.test(msg);
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * マイページ（ユーザー向け）
 *
 * ブロックチェーンからスタンプを読み込み、NFT発行機能を提供します。
 * 同一組織から3つ以上のスタンプがある場合、NFT証明書に交換できます。
 */
export default function MyPage() {
  const navigate = useNavigate();
  const { nftContract, stampManagerContract, isReady } = useContracts();
  const { account, isConnected } = useWallet();
  const [nfts, setNfts] = useState([]);
  const [organizationGroups, setOrganizationGroups] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [mintingOrg, setMintingOrg] = useState(null);
  const [nftEligibleOrgs, setNftEligibleOrgs] = useState([]); // NFT発行可能な組織リスト
  const [showNotification, setShowNotification] = useState(false); // 通知表示フラグ
  const [notificationOrg, setNotificationOrg] = useState(null); // 通知対象の組織

  /**
   * ブロックチェーンからスタンプを読み込む（SFTベース）
   */
  const loadStamps = useCallback(async () => {
    if (!stampManagerContract || !account) return;

    try {
      // デバッグ: コントラクトアドレスを確認
      const contractAddress = stampManagerContract.target;
      console.log(
        "[MyPage] StampManagerコントラクトアドレス:",
        contractAddress
      );
      console.log("[MyPage] ユーザーアドレス:", account);

      // SFTベースでスタンプを取得（tokenIdsとamountsの配列を返す）
      let tokenIds, amounts;
      try {
        // まずは通常の呼び出し（MetaMask/Anvil環境で blockTag を先読みすると逆にズレることがある）
        console.log("[MyPage] getUserStampsを呼び出します...");
        [tokenIds, amounts] = await stampManagerContract.getUserStamps(account);
        console.log("[MyPage] getUserStamps成功:", { tokenIds, amounts });
      } catch (stampsError) {
        // BlockOutOfRangeErrorはブロックチェーンの同期問題
        // エラーメッセージを確認して、適切に処理
        const errorMessage = getRpcErrorMessage(stampsError);
        const isBlockOutOfRange = isBlockOutOfRangeError(stampsError);
        const isCallException =
          stampsError.code === "CALL_EXCEPTION" ||
          errorMessage.includes("missing revert data") ||
          errorMessage.includes("execution reverted");

        if (isBlockOutOfRange) {
          // BlockOutOfRangeErrorの場合は、エラーメッセージからheightを抜いて、そのheightでリトライ
          console.warn(
            "ブロックチェーンのブロック高さが不足しています。heightを抽出してリトライします...",
            "エラーメッセージ:",
            errorMessage
          );
          try {
            const parsed = parseBlockOutOfRange(errorMessage);
            console.log("パース結果:", parsed);
            if (parsed?.height != null && Number.isFinite(parsed.height)) {
              // エラーから抽出したheightを使用（これがAnvilの実際のブロック高さ）
              console.log(`ブロック ${parsed.height} でリトライします`);
              [tokenIds, amounts] = await stampManagerContract.getUserStamps(
                account,
                { blockTag: parsed.height }
              );
              console.log("✅ リトライ後、スタンプの読み込みに成功しました");
            } else {
              // パースできない場合は、プロバイダーから現在のブロック番号を取得
              console.warn("heightの抽出に失敗。プロバイダーから取得します...");
              const provider = stampManagerContract.runner?.provider;
              if (provider) {
                try {
                  const currentBlock = await provider.getBlockNumber();
                  console.log(
                    `プロバイダーから取得したブロック番号: ${currentBlock}`
                  );
                  [tokenIds, amounts] =
                    await stampManagerContract.getUserStamps(account, {
                      blockTag: currentBlock,
                    });
                  console.log(
                    "✅ プロバイダーから取得したブロックでリトライ成功"
                  );
                } catch (providerError) {
                  console.warn(
                    "プロバイダーからの取得も失敗。短時間待って再試行...",
                    getRpcErrorMessage(providerError)
                  );
                  await sleep(500);
                  [tokenIds, amounts] =
                    await stampManagerContract.getUserStamps(account);
                  console.log("✅ 通常呼び出しでリトライ成功");
                }
              } else {
                // プロバイダーが取得できない場合は短時間待って通常の呼び出しを再試行
                await sleep(500);
                [tokenIds, amounts] = await stampManagerContract.getUserStamps(
                  account
                );
                console.log("✅ 通常呼び出しでリトライ成功");
              }
            }
          } catch (retryError) {
            // リトライでもエラーが発生した場合は、空の配列で続行
            console.warn(
              "リトライに失敗しました。空の配列で続行します。",
              getRpcErrorMessage(retryError)
            );
            tokenIds = [];
            amounts = [];
          }
        } else if (isCallException) {
          // missing revert dataエラーは、コントラクトが存在しないか、関数が実装されていない場合に発生
          console.warn(
            "StampManagerコントラクトのgetUserStamps呼び出しに失敗しました。コントラクトが正しくデプロイされているか確認してください。"
          );
          // フォールバック: ローカルストレージのキャッシュを表示（新規スタンプは反映されないが、画面は壊さない）
          const cachedStamps = storage.getStamps() || [];
          const groups = {};
          cachedStamps.forEach((stamp) => {
            const org = stamp.organization || "Unknown";
            if (!groups[org]) groups[org] = [];
            groups[org].push(stamp);
          });
          setOrganizationGroups(groups);
          setError(
            "ブロックチェーンからスタンプを取得できませんでした（.env.localのコントラクトアドレスが古い可能性）。キャッシュを表示しています。"
          );
          return;
        } else {
          throw stampsError; // 他のエラーは再スロー
        }
      }

      // 各tokenIdのメタデータを取得
      const formattedStamps = [];
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        const amount = amounts[i];

        try {
          // StampManager経由でメタデータを取得（SFTコントラクトの直接アクセスは不要）
          const metadata = await stampManagerContract.getStampMetadata(tokenId);

          // Ethers.js v6では構造体が配列として返される場合があるため、両方の形式に対応
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

          // 数量分だけスタンプを追加
          for (let j = 0; j < Number(amount); j++) {
            formattedStamps.push({
              id: tokenId.toString() + "-" + j, // 一意のIDを生成
              tokenId: tokenId.toString(),
              name: stampName,
              organization: stampOrganization,
              category: stampCategory,
              issuedAt: new Date(Number(stampCreatedAt) * 1000)
                .toISOString()
                .split("T")[0],
              amount: Number(amount),
            });
          }
        } catch (err) {
          console.warn(`TokenId ${tokenId}のメタデータ取得に失敗:`, err);
        }
      }

      // 企業別にグループ化
      const groups = {};
      formattedStamps.forEach((stamp) => {
        if (!groups[stamp.organization]) {
          groups[stamp.organization] = [];
        }
        groups[stamp.organization].push(stamp);
      });
      setOrganizationGroups(groups);
    } catch (error) {
      console.error("Error loading stamps:", error);

      // エラーの種類に応じて適切なメッセージを表示
      if (error.message && error.message.includes("execution reverted")) {
        // コントラクトが存在しない、または関数が存在しない場合
        console.warn(
          "コントラクト呼び出しエラー: コントラクトが存在しないか、関数が実装されていません"
        );
        // エラーメッセージは表示しない（ユーザーには影響しない）
      } else if (
        error.message &&
        (error.message.includes("BlockOutOfRangeError") ||
          error.message.includes("block height"))
      ) {
        // BlockOutOfRangeErrorは無視（ブロックチェーンの同期問題）
        console.warn(
          "ブロックチェーンのブロック高さが不足しています。スタンプの読み込みをスキップします。"
        );
        // エラーメッセージは表示しない
      } else {
        // その他のエラーは警告として記録
        console.warn(
          "スタンプの読み込み中にエラーが発生しました:",
          error.message
        );
        setError("スタンプの読み込みに失敗しました");
      }
    }
  }, [stampManagerContract, account]);

  /**
   * ブロックチェーンからNFTを読み込む
   */
  const loadNFTs = useCallback(async () => {
    if (!nftContract || !account) return;

    try {
      // コントラクトの存在確認
      let contractCode;
      try {
        contractCode = await nftContract.runner.provider.getCode(
          nftContract.target
        );
      } catch (codeError) {
        // BlockOutOfRangeErrorなどのネットワークエラーを処理
        if (isBlockOutOfRangeError(codeError)) {
          console.warn(
            "ブロックチェーンのブロック高さが不足しています。NFTの読み込みを続行します..."
          );
          // height が取れる場合は、その height で getCode を再試行
          const msg = getRpcErrorMessage(codeError);
          const parsed = parseBlockOutOfRange(msg);
          if (parsed?.height != null && Number.isFinite(parsed.height)) {
            try {
              contractCode = await nftContract.runner.provider.getCode(
                nftContract.target,
                parsed.height
              );
            } catch {
              // 再試行に失敗しても続行
            }
          }
        } else {
          throw codeError; // 他のエラーは再スロー
        }
      }

      if (contractCode && (contractCode === "0x" || contractCode === "0x0")) {
        console.warn(
          "NonFungibleCareerNFTコントラクトが存在しません:",
          nftContract.target
        );
        return;
      }

      // 総供給量を取得
      let totalSupply;
      try {
        // まずは通常の呼び出し（blockTag先読みでズレるケースを回避）
        totalSupply = await nftContract.getTotalSupply();
      } catch (supplyError) {
        // BlockOutOfRangeErrorはブロックチェーンの同期問題
        const errorMessage = getRpcErrorMessage(supplyError);
        const isBlockOutOfRange = isBlockOutOfRangeError(supplyError);

        if (isBlockOutOfRange) {
          // BlockOutOfRangeErrorの場合は、エラーメッセージからheightを抜いて、そのheightでリトライ
          console.warn(
            "ブロックチェーンのブロック高さが不足しています。heightを抽出してリトライします..."
          );
          try {
            const parsed = parseBlockOutOfRange(errorMessage);
            if (parsed?.height != null && Number.isFinite(parsed.height)) {
              totalSupply = await nftContract.getTotalSupply({
                blockTag: parsed.height,
              });
            } else {
              await sleep(250);
              totalSupply = await nftContract.getTotalSupply();
            }
            console.log("✅ リトライ後、NFTの総供給量の読み込みに成功しました");
          } catch (retryError) {
            // リトライでもエラーが発生した場合は、NFTの読み込みをスキップ
            console.warn(
              "リトライに失敗しました。NFTの読み込みをスキップします。",
              getRpcErrorMessage(retryError)
            );
            return; // NFTの読み込みをスキップ
          }
        } else if (
          supplyError.code === "CALL_EXCEPTION" ||
          errorMessage.includes("missing revert data") ||
          errorMessage.includes("execution reverted")
        ) {
          // missing revert dataエラーは、コントラクトが存在しないか、関数が実装されていない場合に発生
          console.warn(
            "NFTコントラクトのgetTotalSupply呼び出しに失敗しました。コントラクトが正しくデプロイされているか確認してください。"
          );
          return; // NFTの読み込みをスキップ
        } else {
          throw supplyError; // 他のエラーは再スロー
        }
      }

      // すべてのNFTを確認して、ユーザーが所有するものを取得
      const userNFTs = [];
      for (let i = 0; i < Number(totalSupply); i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const tokenURI = await nftContract.tokenURI(i);
            const tokenName = await nftContract.getTokenName(i);
            const rarity = await nftContract.getTokenRarity(i);
            const organizations = await nftContract.getTokenOrganizations(i);

            userNFTs.push({
              id: i.toString(),
              tokenId: i,
              name: tokenName,
              uri: tokenURI,
              rarity,
              organizations: organizations,
            });
          }
        } catch {
          // トークンが存在しない場合はスキップ
          continue;
        }
      }

      setNfts(userNFTs);
    } catch (error) {
      console.error("Error loading NFTs:", error);

      // エラーの種類に応じて適切に処理
      if (error.message && error.message.includes("execution reverted")) {
        // コントラクトが存在しない、または関数が存在しない場合
        console.warn(
          "コントラクト呼び出しエラー: コントラクトが存在しないか、関数が実装されていません"
        );
        // エラーメッセージは表示しない（ユーザーには影響しない）
      } else if (
        error.message &&
        (error.message.includes("BlockOutOfRangeError") ||
          error.message.includes("block height"))
      ) {
        // BlockOutOfRangeErrorは無視（ブロックチェーンの同期問題）
        console.warn(
          "ブロックチェーンのブロック高さが不足しています。NFTの読み込みをスキップします。"
        );
        // エラーメッセージは表示しない
      } else {
        // その他のエラーは警告として記録
        console.warn("NFTの読み込み中にエラーが発生しました:", error.message);
      }
    }
  }, [nftContract, account]);

  /**
   * データを読み込む
   */
  useEffect(() => {
    const loadData = async () => {
      if (!isConnected || !isReady || !account) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([loadStamps(), loadNFTs()]);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("データの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isConnected, isReady, account, loadStamps, loadNFTs]);

  /**
   * スタンプ読み込み後にNFT発行可能性をチェック
   */
  useEffect(() => {
    const checkNFTEligibility = async () => {
      if (!stampManagerContract || !account) return;

      try {
        // 現在の組織グループから組織リストを取得
        const orgs = Object.keys(organizationGroups);
        if (orgs.length === 0) {
          setNftEligibleOrgs([]);
          return;
        }

        const eligibleOrgs = [];

        for (const org of orgs) {
          try {
            // コントラクトの存在確認はスキップ（MetaMask/Anvil環境でBlockOutOfRangeErrorになりやすいため）

            // ブロックチェーンから直接組織別スタンプ数を取得
            const count = await stampManagerContract.getOrganizationStampCount(
              account,
              org
            );
            const canMint = await stampManagerContract.canMintNft(account, org);

            if (canMint && Number(count) >= 3) {
              eligibleOrgs.push(org);
            }
          } catch (err) {
            // execution revertedエラーは無視（コントラクトが存在しない場合など）
            if (err.message && err.message.includes("execution reverted")) {
              console.warn(
                `コントラクト呼び出しエラー (${org}): コントラクトが存在しないか、関数が実装されていません`
              );
            } else {
              console.error(`Error checking eligibility for ${org}:`, err);
            }
          }
        }

        setNftEligibleOrgs(eligibleOrgs);
      } catch (error) {
        console.error("Error checking NFT eligibility:", error);
      }
    };

    if (
      Object.keys(organizationGroups).length > 0 &&
      stampManagerContract &&
      account
    ) {
      checkNFTEligibility();
    }
  }, [organizationGroups, stampManagerContract, account]);

  /**
   * スタンプ発行イベントを監視し、条件を満たしたら自動的にNFTを発行
   */
  useEffect(() => {
    if (!stampManagerContract || !nftContract || !account || !isReady) return;

    // StampIssuedイベントを監視
    const filter = stampManagerContract.filters.StampIssued(account);

    const handleStampIssued = async (user, name, organization, timestamp) => {
      console.log("📬 新しいスタンプが発行されました:", {
        user,
        name,
        organization,
        timestamp,
      });

      // スタンプを再読み込み
      await loadStamps();

      // 少し待ってからNFT発行可能性をチェック（ブロックチェーンの状態が更新されるまで）
      setTimeout(async () => {
        try {
          const count = await stampManagerContract.getOrganizationStampCount(
            account,
            organization
          );
          const canMint = await stampManagerContract.canMintNft(
            account,
            organization
          );

          console.log(
            `📊 ${organization}のスタンプ数: ${count}, NFT発行可能: ${canMint}`
          );

          // 3枚以上でNFT発行可能な場合
          if (canMint && Number(count) >= 3) {
            // 既にその組織のNFTが発行されているかチェック
            // NFTコントラクトから直接確認
            let hasExistingNFT = false;
            try {
              let totalSupply;
              try {
                // まずは通常の呼び出し（blockTag先読みでズレるケースを回避）
                totalSupply = await nftContract.getTotalSupply();
              } catch (supplyError) {
                // BlockOutOfRangeErrorはブロックチェーンの同期問題
                const errorMessage = getRpcErrorMessage(supplyError);
                const isBlockOutOfRange = isBlockOutOfRangeError(supplyError);

                if (isBlockOutOfRange) {
                  // BlockOutOfRangeErrorの場合は、エラーメッセージからheightを抜いて、そのheightでリトライ
                  console.warn(
                    "ブロックチェーンのブロック高さが不足しています。heightを抽出してリトライします..."
                  );
                  try {
                    const parsed = parseBlockOutOfRange(errorMessage);
                    if (
                      parsed?.height != null &&
                      Number.isFinite(parsed.height)
                    ) {
                      totalSupply = await nftContract.getTotalSupply({
                        blockTag: parsed.height,
                      });
                    } else {
                      await sleep(250);
                      totalSupply = await nftContract.getTotalSupply();
                    }
                  } catch (retryError) {
                    // リトライでもエラーが発生した場合は、既存NFTがないものとして扱う
                    console.warn(
                      "リトライに失敗しました。既存NFTのチェックをスキップします。",
                      getRpcErrorMessage(retryError)
                    );
                    totalSupply = 0; // 既存NFTがないものとして扱う
                  }
                } else if (
                  // missing revert dataエラーは、コントラクトが存在しないか、関数が実装されていない場合に発生
                  supplyError.code === "CALL_EXCEPTION" ||
                  errorMessage.includes("missing revert data") ||
                  errorMessage.includes("execution reverted")
                ) {
                  console.warn(
                    "NFTコントラクトのgetTotalSupply呼び出しに失敗しました。既存NFTのチェックをスキップします。"
                  );
                  totalSupply = 0; // 既存NFTがないものとして扱う
                } else {
                  throw supplyError; // 他のエラーは再スロー
                }
              }
              for (let i = 0; i < Number(totalSupply); i++) {
                try {
                  const owner = await nftContract.ownerOf(i);
                  if (owner.toLowerCase() === account.toLowerCase()) {
                    const tokenOrgs = await nftContract.getTokenOrganizations(
                      i
                    );
                    if (tokenOrgs && tokenOrgs.includes(organization)) {
                      hasExistingNFT = true;
                      break;
                    }
                  }
                } catch {
                  continue;
                }
              }
            } catch (err) {
              console.error("Error checking existing NFTs:", err);
            }

            // 既に発行済みでない場合のみ自動発行
            if (!hasExistingNFT) {
              console.log(
                `🎉 ${organization}のスタンプが3枚に達しました。NFTを自動発行します...`
              );

              // 自動的にNFTを発行
              try {
                setMinting(true);
                setMintingOrg(organization);
                setError(null);

                // NFT を発行（StampManager経由）
                // mintNFT(address to, string memory uri, string memory name, string memory rarity, string memory organization)
                // 自動発行であることが分かる名称を使用（企業側で発行するNFT証明書とは区別）
                const tx = await stampManagerContract.mintNFT(
                  account,
                  `https://example.com/metadata/${Date.now()}.json`,
                  `${organization} スタンプコレクション証明書`,
                  "Common", // デフォルトはCommon（ルールID 1に基づく）
                  organization
                );

                // トランザクションの確認を待つ
                await tx.wait();

                console.log(`✅ NFTが正常に自動発行されました！`);

                // データを再読み込み
                await Promise.all([loadStamps(), loadNFTs()]);

                // 通知を表示
                setNotificationOrg(organization);
                setShowNotification(true);
                setNftEligibleOrgs((prev) => {
                  if (!prev.includes(organization)) {
                    return [...prev, organization];
                  }
                  return prev;
                });
              } catch (mintError) {
                console.error("Error auto-minting NFT:", mintError);
                let errorMessage = "NFT の自動発行に失敗しました";
                if (mintError.reason) {
                  errorMessage = mintError.reason;
                } else if (mintError.message) {
                  errorMessage = mintError.message;
                }
                setError(errorMessage);
              } finally {
                setMinting(false);
                setMintingOrg(null);
              }
            } else {
              console.log(`ℹ️ ${organization}のNFTは既に発行済みです。`);
            }
          }
        } catch (err) {
          console.error("Error checking NFT eligibility after stamp:", err);
        }
      }, 2000); // 2秒待つ
    };

    // イベントリスナーを設定
    stampManagerContract.on(filter, handleStampIssued);

    // クリーンアップ
    return () => {
      stampManagerContract.off(filter, handleStampIssued);
    };
  }, [
    stampManagerContract,
    nftContract,
    account,
    isReady,
    loadStamps,
    loadNFTs,
  ]);

  /**
   * 既に発行済みのNFTがあるかチェック
   *
   * @param {string} organization - 組織名
   * @returns {boolean} 既に発行済みかどうか
   */
  const hasExistingNFT = useCallback(
    (organization) => {
      return nfts.some(
        (nft) => nft.organizations && nft.organizations.includes(organization)
      );
    },
    [nfts]
  );

  /**
   * NFT発行可能かチェック（既に発行済みの場合はfalse）
   *
   * @param {string} org - 組織名
   * @param {number} count - スタンプ数
   * @returns {boolean} NFT発行可能かどうか
   */
  const canMintNFT = (org, count) => {
    // 既に発行済みの場合はfalse
    if (hasExistingNFT(org)) {
      return false;
    }
    return count >= 3;
  };

  /**
   * NFTを発行する関数
   *
   * @param {string} organization - 組織名
   */
  const handleMintNFT = async (organization) => {
    if (!nftContract || !account) return;

    setMinting(true);
    setMintingOrg(organization);
    setError(null);

    try {
      // NFT を発行（StampManager経由）
      // mintNFT(address to, string memory uri, string memory name, string memory rarity, string memory organization)
      // 自動発行であることが分かる名称を使用（企業側で発行するNFT証明書とは区別）
      const tx = await stampManagerContract.mintNFT(
        account,
        `https://example.com/metadata/${Date.now()}.json`,
        `${organization} スタンプコレクション証明書`,
        "Rare",
        organization
      );

      // トランザクションの確認を待つ
      await tx.wait();

      // データを再読み込み（NFT証明書ページに反映される）
      await Promise.all([loadStamps(), loadNFTs()]);

      // 成功メッセージとNFT証明書ページへのリンク
      const goToNFTs = window.confirm(
        "NFT が正常に発行されました！\nNFT証明書ページで確認しますか？"
      );
      if (goToNFTs) {
        navigate("/student/nfts");
      }

      // 少し待ってからNFT発行可能性を再チェック（nftsが更新されるまで待つ）
      setTimeout(async () => {
        const orgs = Object.keys(organizationGroups);
        if (orgs.length > 0 && stampManagerContract && account) {
          const eligibleOrgs = [];
          for (const org of orgs) {
            try {
              const count =
                await stampManagerContract.getOrganizationStampCount(
                  account,
                  org
                );
              const canMint = await stampManagerContract.canMintNft(
                account,
                org
              );
              // 既に発行済みのNFTがない場合のみ追加
              if (canMint && Number(count) >= 3) {
                // nftsが更新された後にチェック
                const alreadyMinted = nfts.some(
                  (nft) => nft.organizations && nft.organizations.includes(org)
                );
                if (!alreadyMinted) {
                  eligibleOrgs.push(org);
                }
              }
            } catch (err) {
              console.error(`Error checking eligibility for ${org}:`, err);
            }
          }
          setNftEligibleOrgs(eligibleOrgs);
        }
      }, 1000);
    } catch (error) {
      console.error("Error minting NFT:", error);

      let errorMessage = "NFT 発行に失敗しました";
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setMinting(false);
      setMintingOrg(null);
    }
  };

  // ウォレットが接続されていない場合の表示
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold text-lg">
            ウォレットを接続してください
          </p>
          <p className="text-red-500 mt-2">
            スタンプを確認するには、MetaMask
            などのウォレットを接続する必要があります。
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error && Object.keys(organizationGroups).length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-semibold mb-2">エラー</div>
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* NFT発行可能通知 */}
      {showNotification && notificationOrg && (
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl shadow-2xl p-6 border-2 border-green-300 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-5xl">🎉</div>
              <div>
                <h3 className="text-2xl font-bold mb-1">
                  NFT証明書が発行可能になりました！
                </h3>
                <p className="text-green-50">
                  {notificationOrg}から3枚のスタンプを集めました。
                  NFT証明書に交換できます。
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowNotification(false);
                  handleMintNFT(notificationOrg);
                }}
                className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
              >
                🏆 今すぐ発行
              </button>
              <button
                onClick={() => {
                  setShowNotification(false);
                  setNotificationOrg(null);
                }}
                className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                後で
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-3xl">💼</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">マイスタンプ</h1>
          <p className="text-gray-600 mt-1">あなたのスタンプコレクション</p>
        </div>
      </div>

      {/* 企業別スタンプ */}
      <div className="space-y-6">
        {Object.keys(organizationGroups).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="text-8xl mb-6">📭</div>
            <p className="text-gray-700 text-xl font-semibold mb-2">
              まだスタンプがありません
            </p>
            <p className="text-gray-500 text-base">
              企業のイベントに参加してスタンプを集めましょう！
            </p>
          </div>
        ) : (
          Object.entries(organizationGroups).map(([org, orgStamps]) => {
            const count = orgStamps.length;
            // 既に発行済みのNFTがあるかチェック
            const alreadyMinted = hasExistingNFT(org);
            // ブロックチェーンから取得した情報も考慮（ただし、既に発行済みの場合はfalse）
            const canMint =
              !alreadyMinted &&
              (canMintNFT(org, count) || nftEligibleOrgs.includes(org));

            return (
              <div
                key={org}
                className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {org}
                    </h2>
                    <p className="text-gray-600">スタンプ {count}/3</p>
                  </div>
                  {alreadyMinted ? (
                    <span className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      ✅ NFT 交換済み
                    </span>
                  ) : canMint ? (
                    <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                      ✨ NFT 交換可能！
                    </span>
                  ) : null}
                </div>
                <div className="mb-6">
                  <ProgressBar current={count} total={3} label="" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {orgStamps.map((stamp) => (
                    <StampCard key={stamp.id} stamp={stamp} />
                  ))}
                  {Array.from({ length: 3 - count }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[120px]"
                    >
                      <span className="text-gray-300 text-4xl mb-2">⬜</span>
                      <span className="text-gray-400 text-xs">未取得</span>
                    </div>
                  ))}
                </div>
                {alreadyMinted ? (
                  <div className="w-full bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 text-blue-700 py-4 rounded-xl font-bold text-lg text-center">
                    <span className="mr-2">✅</span>
                    NFT証明書を取得済みです
                    <button
                      onClick={() => navigate("/student/nfts")}
                      className="ml-4 text-blue-600 underline hover:text-blue-800"
                    >
                      NFT証明書ページで確認
                    </button>
                  </div>
                ) : canMint ? (
                  <button
                    onClick={() => handleMintNFT(org)}
                    disabled={minting || !isReady || mintingOrg === org}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {minting && mintingOrg === org
                      ? "⏳ 発行中..."
                      : "🏆 NFT 証明書に交換する"}
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-semibold">エラー</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* 取得したNFT証明書 */}
      {nfts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              取得した NFT 証明書
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
