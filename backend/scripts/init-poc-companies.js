/**
 * PoC用企業データ初期化スクリプト
 *
 * Anvilの奇数インデックスのウォレットアドレスに固定の企業名を設定します。
 * 実行方法: node scripts/init-poc-companies.js
 */
import { createOrUpdateCompany } from "../src/lib/dynamo-companies.js";
import dotenv from "dotenv";
dotenv.config();

// Anvilの奇数インデックスのウォレットアドレスと企業名の固定マッピング
const POC_COMPANIES = [
  {
    walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // (1)
    companyName: "テックイノベーション株式会社",
  },
  {
    walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // (3)
    companyName: "マーケティングプロ株式会社",
  },
  {
    walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", // (5)
    companyName: "クリエイティブスタジオ株式会社",
  },
  {
    walletAddress: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", // (7)
    companyName: "デジタルソリューション株式会社",
  },
  {
    walletAddress: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", // (9)
    companyName: "イノベーションテック株式会社",
  },
];

/**
 * PoC用企業データを初期化
 */
async function initPocCompanies() {
  console.log("=== PoC用企業データ初期化開始 ===\n");

  const results = [];

  for (const { walletAddress, companyName } of POC_COMPANIES) {
    try {
      console.log(`📝 企業登録中: ${companyName} (${walletAddress})...`);

      const company = await createOrUpdateCompany({
        walletAddress,
        companyName,
        status: "active",
      });

      results.push({
        walletAddress,
        companyName: company.companyName,
        status: "success",
      });

      console.log(`✅ 登録完了: ${company.companyName}\n`);
    } catch (error) {
      console.error(`❌ エラー: ${walletAddress} - ${error.message}\n`);
      results.push({
        walletAddress,
        companyName: null,
        status: "error",
        error: error.message,
      });
    }
  }

  console.log("=== 初期化結果 ===\n");
  console.table(results);
  console.log("\n=== PoC用企業データ初期化完了 ===");
}

initPocCompanies()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 初期化失敗:", error);
    process.exit(1);
  });
