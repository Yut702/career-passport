import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import { useWalletConnect } from "../hooks/useWalletConnect";
import StampCard from "../components/StampCard";
import NFTCard from "../components/NFTCard";

export default function OrgNFTs() {
  const { nftContract, stampManagerContract, isReady } = useContracts();
  const { account, isConnected } = useWalletConnect();
  const [nfts, setNfts] = useState([]);
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStamps, setLoadingStamps] = useState(true);
  const [organization, setOrganization] = useState(null);

  /**
   * 企業の組織名を取得
   */
  const loadOrganization = useCallback(async () => {
    if (!stampManagerContract || !account || !isReady) {
      // コントラクトが準備できていない場合は、組織名なしでNFTを読み込む
      setOrganization("");
      return;
    }

    try {
      // コントラクトが存在するか確認
      const contractCode = await stampManagerContract.runner.provider.getCode(
        stampManagerContract.target
      );
      if (contractCode === "0x" || contractCode === "0x0") {
        // コントラクトが存在しない場合は初期状態として扱う
        setOrganization("");
        return;
      }

      const orgName = await stampManagerContract.issuerOrganization(account);
      console.log("組織名を取得:", orgName, "アドレス:", account);
      if (orgName && orgName.trim() !== "") {
        setOrganization(orgName);
      } else {
        // 組織名が設定されていない場合は空文字列を設定（すべてのNFTを表示）
        console.warn("組織名が設定されていません。すべてのNFTを表示します。");
        setOrganization("");
      }
    } catch (err) {
      // コントラクトが存在しない、またはデータが存在しない場合は初期状態として扱う
      if (
        err.code === "BAD_DATA" ||
        err.message?.includes("could not decode result data") ||
        err.message?.includes('value="0x"')
      ) {
        // 初期状態として扱う（エラーを表示しない）
        setOrganization("");
        return;
      }
      console.error("Error loading organization:", err);
      // エラーが発生した場合も空文字列を設定して続行
      setOrganization("");
    }
  }, [stampManagerContract, account, isReady]);

  /**
   * 企業が発行したスタンプをブロックチェーンから取得（StampIssuedイベントから）
   */
  const loadStamps = useCallback(async () => {
    if (!stampManagerContract || !account || !isReady) {
      setLoadingStamps(false);
      return;
    }

    setLoadingStamps(true);
    console.log("スタンプを読み込み中...");

    try {
      // コントラクトの存在確認
      const contractCode = await stampManagerContract.runner.provider.getCode(
        stampManagerContract.target
      );
      if (contractCode === "0x" || contractCode === "0x0") {
        console.warn("StampManagerコントラクトが存在しません");
        setStamps([]);
        setLoadingStamps(false);
        return;
      }

      // StampIssuedイベントをクエリ（組織名でフィルタリング）
      // 注意: イベントのorganizationはindexedではないため、すべてのイベントを取得してフィルタリングする必要がある
      const filter = stampManagerContract.filters.StampIssued();
      const events = await stampManagerContract.queryFilter(filter);

      const issuedStamps = [];
      const seenTokenIds = new Set(); // 重複を防ぐ

      for (const event of events) {
        try {
          const eventArgs = event.args;
          const eventIssuer = eventArgs.issuer; // 発行者アドレス
          const tokenId = eventArgs.tokenId;

          // 発行者アドレスが一致する場合のみ追加（接続中のアカウントが発行者）
          const isIssuerMatch =
            eventIssuer && account
              ? eventIssuer.toLowerCase() === account.toLowerCase()
              : false;

          // 発行者アドレスが一致する場合のみ追加
          if (isIssuerMatch && !seenTokenIds.has(tokenId.toString())) {
            seenTokenIds.add(tokenId.toString());

            // スタンプのメタデータを取得
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

            issuedStamps.push({
              id: `stamp_${tokenId}`,
              tokenId: tokenId.toString(),
              name: stampName,
              organization: stampOrganization,
              category: stampCategory,
              issuedAt: new Date(Number(stampCreatedAt) * 1000)
                .toISOString()
                .split("T")[0],
              userAddress: eventArgs.user,
              imageType: stampImageType,
            });
          }
        } catch (err) {
          console.warn(`イベント処理エラー:`, err);
        }
      }

      // 発行日順（新しい順）にソート
      issuedStamps.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

      setStamps(issuedStamps);
    } catch (err) {
      console.error("Error loading stamps:", err);
      setStamps([]);
    } finally {
      setLoadingStamps(false);
    }
  }, [stampManagerContract, account, isReady]);

  /**
   * 企業が発行したNFTをブロックチェーンから取得
   */
  const loadNFTs = useCallback(async () => {
    if (!nftContract || !account || !isReady) {
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("NFTを読み込み中...");

    try {
      // コントラクトの存在確認
      const contractCode = await nftContract.runner.provider.getCode(
        nftContract.target
      );
      if (contractCode === "0x" || contractCode === "0x0") {
        console.warn("NFTコントラクトが存在しません");
        setNfts([]);
        setLoading(false);
        return;
      }

      // 総供給量を取得
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

      // すべてのNFTをループして、自分の組織が含まれているものを取得
      const issuedNFTs = [];

      for (let i = 0; i < totalSupplyNumber; i++) {
        try {
          // まず発行者アドレスを取得してフィルタリング（効率化のため）
          let issuer = null;
          try {
            if (typeof nftContract.getTokenIssuer === "function") {
              issuer = await nftContract.getTokenIssuer(i);
            } else {
              // getTokenIssuerが存在しない場合は、ownerをissuerとして扱う（フォールバック）
              const owner = await nftContract.ownerOf(i);
              issuer = owner;
            }
          } catch (err) {
            console.warn(
              `getTokenIssuer failed for token ${i}, skipping:`,
              err
            );
            continue; // 発行者が取得できない場合はスキップ
          }

          // 発行者アドレスが一致する場合のみ処理を続行（ログインアドレスが作成者アドレスになっているNFTのみ表示）
          const isIssuerMatch =
            issuer && account
              ? issuer.toLowerCase() === account.toLowerCase()
              : false;

          if (!isIssuerMatch) {
            continue; // 発行者が一致しない場合はスキップ
          }

          // NFTの詳細情報を取得
          const tokenURI = await nftContract.tokenURI(i);
          const tokenName = await nftContract.getTokenName(i);
          const rarity = await nftContract.getTokenRarity(i);
          const owner = await nftContract.ownerOf(i);
          const organizations = await nftContract.getTokenOrganizations(i);

          // getTokenImageTypeが存在しない場合のフォールバック処理
          let imageType = 0;
          try {
            if (typeof nftContract.getTokenImageType === "function") {
              imageType = await nftContract.getTokenImageType(i);
            } else {
              // レアリティに基づいてデフォルト値を設定
              const rarityLower = rarity.toLowerCase();
              if (rarityLower === "common") imageType = 10;
              else if (rarityLower === "rare") imageType = 20;
              else if (rarityLower === "epic") imageType = 30;
              else if (rarityLower === "legendary") imageType = 40;
              else imageType = 10;
            }
          } catch (err) {
            console.warn(
              `getTokenImageType failed for token ${i}, using default:`,
              err
            );
            // レアリティに基づいてデフォルト値を設定
            const rarityLower = rarity.toLowerCase();
            if (rarityLower === "common") imageType = 10;
            else if (rarityLower === "rare") imageType = 20;
            else if (rarityLower === "epic") imageType = 30;
            else if (rarityLower === "legendary") imageType = 40;
            else imageType = 10;
          }

          issuedNFTs.push({
            id: `nft_${i}`,
            tokenId: i,
            name: tokenName,
            description: "", // 説明（メタデータから取得する場合は tokenURI を使用）
            rarity: rarity.toLowerCase(),
            organizations: organizations,
            contractAddress: nftContract.target,
            metadataURI: tokenURI,
            owner: owner,
            issuedAt: new Date().toISOString().split("T")[0], // 発行日（簡易版）
            imageType: Number(imageType),
          });
        } catch (err) {
          // トークンが存在しない場合はスキップ
          console.warn(`Token ${i} does not exist:`, err);
        }
      }

      // 発行日順（新しい順）にソート
      issuedNFTs.sort((a, b) => b.tokenId - a.tokenId);

      setNfts(issuedNFTs);
    } catch (err) {
      console.error("Error loading NFTs:", err);
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [nftContract, account, isReady]);

  // 組織名を読み込む（表示用）
  useEffect(() => {
    if (isConnected && account && isReady) {
      loadOrganization();
    } else if (!isConnected || !account) {
      setOrganization(null);
      setLoading(false);
    }
  }, [isConnected, account, isReady, loadOrganization]);

  // スタンプとNFTを読み込む
  useEffect(() => {
    if (isConnected && account && isReady) {
      loadStamps();
      loadNFTs();
    }
  }, [isConnected, account, isReady, loadStamps, loadNFTs]);

  if (!isConnected || !account) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">ウォレットを接続してください</div>
      </div>
    );
  }

  if (loading || loadingStamps) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            スタンプ/NFT一覧
          </h1>
          <p className="text-gray-600">
            発行したスタンプとNFT証明書の一覧を確認できます
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            to="/org/stamp-issuance"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            🎫 スタンプを発行
          </Link>
          <Link
            to="/org/nft-applications"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            📝 NFT申請を確認
          </Link>
        </div>
      </div>

      {/* スタンプ一覧セクション */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            スタンプ一覧
          </h2>
          <p className="text-gray-600 text-sm">発行したスタンプの一覧</p>
        </div>

        {stamps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stamps.map((stamp) => (
              <div key={stamp.id} className="relative">
                <StampCard stamp={stamp} />
                {/* 企業側用の追加情報 */}
                <div className="mt-2 text-xs text-gray-400 break-all text-center">
                  受取人: {stamp.userAddress?.slice(0, 6)}...
                  {stamp.userAddress?.slice(-4)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🎫</div>
            <p className="text-gray-500 text-lg">
              まだスタンプを発行していません
            </p>
          </div>
        )}
      </div>

      {/* NFT一覧セクション */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">NFT一覧</h2>
          <p className="text-gray-600 text-sm">発行したNFT証明書の一覧</p>
        </div>

        {nfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => {
              // NFTCard用にデータを整形
              const nftCardData = {
                ...nft,
                id: nft.id || `nft_${nft.tokenId}`,
                mintedAt: nft.issuedAt || nft.mintedAt,
              };
              const nftId = nft.id || `nft_${nft.tokenId}`;
              return (
                <NFTCard
                  key={nftId}
                  nft={nftCardData}
                  showLink={true}
                  linkTo={`/org/nft/${nftId}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-500 text-lg">まだNFTを発行していません</p>
          </div>
        )}
      </div>
    </div>
  );
}
