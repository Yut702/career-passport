import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import { useWalletConnect } from "../hooks/useWalletConnect";

export default function OrgNFTDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { nftContract, isReady } = useContracts();
  const { account, isConnected } = useWalletConnect();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * ブロックチェーンからNFTを取得
   */
  const loadNFT = useCallback(async () => {
    if (!nftContract || !isReady) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // IDからtokenIdを抽出（"nft_0" -> 0）
      const tokenId = id.startsWith("nft_")
        ? parseInt(id.replace("nft_", ""))
        : parseInt(id);

      if (isNaN(tokenId)) {
        throw new Error("Invalid NFT ID");
      }

      // コントラクトの存在確認
      const contractCode = await nftContract.runner.provider.getCode(
        nftContract.target
      );
      if (contractCode === "0x" || contractCode === "0x0") {
        throw new Error("NFTコントラクトが存在しません");
      }

      // NFTの詳細情報を取得
      const tokenURI = await nftContract.tokenURI(tokenId);
      const tokenName = await nftContract.getTokenName(tokenId);
      const rarity = await nftContract.getTokenRarity(tokenId);
      const organizations = await nftContract.getTokenOrganizations(tokenId);
      const owner = await nftContract.ownerOf(tokenId);
      const imageType = await nftContract.getTokenImageType(tokenId);

      // 交換に使用したスタンプ情報を取得（存在する場合）
      let exchangedStampTokenIds = [];
      try {
        exchangedStampTokenIds = await nftContract.getExchangedStampTokenIds(
          tokenId
        );
      } catch (err) {
        // この関数が存在しない、またはエラーが発生した場合は無視
        console.warn("交換スタンプ情報の取得に失敗:", err);
      }

      setNft({
        id: `nft_${tokenId}`,
        tokenId: tokenId,
        name: tokenName,
        description: "", // 説明（メタデータから取得する場合は tokenURI を使用）
        rarity: rarity.toLowerCase(),
        organizations: organizations,
        contractAddress: nftContract.target,
        metadataURI: tokenURI,
        owner: owner,
        issuedAt: new Date().toISOString().split("T")[0], // 発行日（簡易版）
        exchangedStampTokenIds: exchangedStampTokenIds,
        imageType: Number(imageType),
      });
    } catch (err) {
      console.error("Error loading NFT:", err);
      setNft(null);
    } finally {
      setLoading(false);
    }
  }, [nftContract, isReady, id]);

  // NFTを読み込む
  useEffect(() => {
    if (isReady) {
      loadNFT();
    }
  }, [isReady, loadNFT]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!isConnected || !account) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">ウォレットを接続してください</div>
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

  if (!nft) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">NFTが見つかりません</p>
        <button
          onClick={() => navigate("/org/nfts")}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          NFT一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/org/nfts")}
        className="mb-6 text-purple-600 hover:text-purple-700 flex items-center space-x-2 transition-colors"
      >
        <span>←</span>
        <span>NFT一覧に戻る</span>
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {nft.name}
            </h1>
            <p className="text-gray-600 text-lg">
              {Array.isArray(nft.organizations)
                ? nft.organizations.join(", ")
                : nft.organization || "組織名なし"}
            </p>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg ml-6">
            <span className="text-5xl">🏆</span>
          </div>
        </div>

        <div className="space-y-6">
          {nft.description && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">説明</h3>
              <p className="text-gray-700">{nft.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Token ID</div>
              <div className="text-2xl font-bold text-purple-700">
                #{nft.tokenId}
              </div>
            </div>
            <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">レアリティ</div>
              <div className="text-lg font-bold text-purple-700 capitalize">
                {nft.rarity}
              </div>
            </div>
            <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">発行日</div>
              <div className="text-sm font-bold text-purple-700">
                {new Date(nft.issuedAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">所有者</div>
              <div className="text-xs font-bold text-purple-700 break-all">
                {nft.owner?.slice(0, 6)}...{nft.owner?.slice(-4)}
              </div>
            </div>
          </div>

          {nft.metadataURI && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                メタデータURI
              </h3>
              <p className="text-gray-700 text-sm break-all bg-gray-50 p-3 rounded-lg">
                {nft.metadataURI}
              </p>
            </div>
          )}

          {nft.exchangedStampTokenIds &&
            nft.exchangedStampTokenIds.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  交換に使用したスタンプ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {nft.exchangedStampTokenIds.map((stampTokenId, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="font-medium text-gray-900">
                        スタンプ Token ID: {stampTokenId.toString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              コントラクト情報
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">
                コントラクトアドレス
              </div>
              <div className="text-xs font-mono text-gray-700 break-all">
                {nft.contractAddress}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
