#!/usr/bin/env node

/**
 * Anvil上のスタンプとNFTの情報を取得するスクリプト
 *
 * 使用方法:
 *   node scripts/query-anvil-data.js
 *
 * 前提条件:
 *   - Anvilが起動していること (http://localhost:8545)
 *   - コントラクトがデプロイされていること
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// コントラクトアドレスを読み込む
const deployedPath = path.join(__dirname, "..", "deployed.json");
const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
const chainId = "31337";
const contracts = deployed[chainId];

if (!contracts) {
  console.error("エラー: deployed.jsonに31337のデータが見つかりません");
  process.exit(1);
}

const STAMP_MANAGER_ADDRESS = contracts.StampManager;
const NFT_CONTRACT_ADDRESS = contracts.NonFungibleCareerNFT;
const RPC_URL = "http://localhost:8545";

// ABIを読み込む
const stampManagerABIPath = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "src",
  "abis",
  "StampManager.json"
);
const nftABIPath = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "src",
  "abis",
  "NonFungibleCareerNFT.json"
);

const stampManagerABI = JSON.parse(
  fs.readFileSync(stampManagerABIPath, "utf8")
);
const nftABI = JSON.parse(fs.readFileSync(nftABIPath, "utf8"));

async function queryAnvilData() {
  console.log("=== Anvil上のスタンプとNFT情報を取得中 ===\n");
  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`StampManager: ${STAMP_MANAGER_ADDRESS}`);
  console.log(`NonFungibleCareerNFT: ${NFT_CONTRACT_ADDRESS}\n`);

  try {
    // プロバイダーを作成
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // コントラクトインスタンスを作成
    const stampManager = new ethers.Contract(
      STAMP_MANAGER_ADDRESS,
      stampManagerABI,
      provider
    );
    const nftContract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      nftABI,
      provider
    );

    // コントラクトの存在確認
    const stampManagerCode = await provider.getCode(STAMP_MANAGER_ADDRESS);
    const nftContractCode = await provider.getCode(NFT_CONTRACT_ADDRESS);

    if (stampManagerCode === "0x" || stampManagerCode === "0x0") {
      console.error("エラー: StampManagerコントラクトが存在しません");
      return;
    }
    if (nftContractCode === "0x" || nftContractCode === "0x0") {
      console.error("エラー: NonFungibleCareerNFTコントラクトが存在しません");
      return;
    }

    // ===== スタンプ情報を取得 =====
    console.log("=== スタンプ情報 ===\n");

    // StampIssuedイベントを取得
    const stampFilter = stampManager.filters.StampIssued();
    const stampEvents = await stampManager.queryFilter(stampFilter);

    console.log(`発行されたスタンプ総数: ${stampEvents.length}枚\n`);

    if (stampEvents.length > 0) {
      const stampDetails = [];
      const seenTokenIds = new Set();

      for (const event of stampEvents) {
        const args = event.args;
        const tokenId = args.tokenId.toString();

        if (seenTokenIds.has(tokenId)) continue;
        seenTokenIds.add(tokenId);

        try {
          // スタンプのメタデータを取得
          const metadata = await stampManager.getStampMetadata(tokenId);
          const name = Array.isArray(metadata) ? metadata[0] : metadata.name;
          const organization = Array.isArray(metadata)
            ? metadata[1]
            : metadata.organization;
          const category = Array.isArray(metadata)
            ? metadata[2]
            : metadata.category;
          const createdAt = Array.isArray(metadata)
            ? metadata[3]
            : metadata.createdAt;

          stampDetails.push({
            tokenId,
            name,
            organization,
            category,
            user: args.user,
            timestamp: new Date(Number(createdAt) * 1000).toISOString(),
            blockNumber: event.blockNumber,
          });
        } catch (err) {
          console.warn(
            `トークンID ${tokenId} のメタデータ取得に失敗:`,
            err.message
          );
        }
      }

      // 組織別にグループ化
      const orgGroups = {};
      stampDetails.forEach((stamp) => {
        if (!orgGroups[stamp.organization]) {
          orgGroups[stamp.organization] = [];
        }
        orgGroups[stamp.organization].push(stamp);
      });

      // 結果を表示
      for (const [org, stamps] of Object.entries(orgGroups)) {
        console.log(`【${org}】`);
        console.log(`  スタンプ数: ${stamps.length}枚`);
        stamps.forEach((stamp) => {
          console.log(`  - Token ID: ${stamp.tokenId}`);
          console.log(`    名前: ${stamp.name}`);
          console.log(`    カテゴリ: ${stamp.category}`);
          console.log(`    受取人: ${stamp.user}`);
          console.log(`    発行日時: ${stamp.timestamp}`);
          console.log(`    ブロック番号: ${stamp.blockNumber}`);
          console.log("");
        });
      }

      // ユニークなユーザー数を計算
      const uniqueUsers = new Set(
        stampDetails.map((s) => s.user.toLowerCase())
      );
      console.log(`ユニークな受取人数: ${uniqueUsers.size}人\n`);
    } else {
      console.log("スタンプはまだ発行されていません\n");
    }

    // ===== NFT情報を取得 =====
    console.log("=== NFT情報 ===\n");

    try {
      const totalSupply = await nftContract.getTotalSupply();
      const totalSupplyNumber = Number(totalSupply);

      console.log(`発行されたNFT総数: ${totalSupplyNumber}枚\n`);

      if (totalSupplyNumber > 0) {
        const nftDetails = [];

        for (let i = 0; i < totalSupplyNumber; i++) {
          try {
            const tokenURI = await nftContract.tokenURI(i);
            const tokenName = await nftContract.getTokenName(i);
            const rarity = await nftContract.getTokenRarity(i);
            const organizations = await nftContract.getTokenOrganizations(i);
            const owner = await nftContract.ownerOf(i);

            nftDetails.push({
              tokenId: i,
              name: tokenName,
              rarity,
              organizations: Array.isArray(organizations)
                ? organizations
                : [organizations],
              owner,
              tokenURI,
            });
          } catch (err) {
            console.warn(`トークンID ${i} の情報取得に失敗:`, err.message);
          }
        }

        // レアリティ別にグループ化
        const rarityGroups = {};
        nftDetails.forEach((nft) => {
          if (!rarityGroups[nft.rarity]) {
            rarityGroups[nft.rarity] = [];
          }
          rarityGroups[nft.rarity].push(nft);
        });

        // 結果を表示
        for (const [rarity, nfts] of Object.entries(rarityGroups)) {
          console.log(`【${rarity.toUpperCase()}】`);
          console.log(`  NFT数: ${nfts.length}枚`);
          nfts.forEach((nft) => {
            console.log(`  - Token ID: ${nft.tokenId}`);
            console.log(`    名前: ${nft.name}`);
            console.log(`    組織: ${nft.organizations.join(", ")}`);
            console.log(`    所有者: ${nft.owner}`);
            console.log(`    Token URI: ${nft.tokenURI}`);
            console.log("");
          });
        }

        // 組織別に集計
        const orgCounts = {};
        nftDetails.forEach((nft) => {
          nft.organizations.forEach((org) => {
            orgCounts[org] = (orgCounts[org] || 0) + 1;
          });
        });

        console.log("組織別NFT発行数:");
        for (const [org, count] of Object.entries(orgCounts)) {
          console.log(`  ${org}: ${count}枚`);
        }
        console.log("");
      } else {
        console.log("NFTはまだ発行されていません\n");
      }
    } catch (err) {
      console.error("NFT情報の取得に失敗:", err.message);
    }

    console.log("=== 完了 ===");
  } catch (error) {
    console.error("エラーが発生しました:", error);
    if (error.code === "ECONNREFUSED") {
      console.error("\nAnvilが起動していない可能性があります。");
      console.error("以下のコマンドでAnvilを起動してください:");
      console.error("  cd contracts && anvil");
    }
    process.exit(1);
  }
}

// スクリプトを実行
queryAnvilData();
