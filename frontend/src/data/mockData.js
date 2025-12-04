// モックデータ

export const mockStamps = [
  {
    id: "stamp_1",
    name: "金融セミナー",
    organization: "野村證券",
    category: "finance",
    issuedAt: "2024-06-15",
  },
  {
    id: "stamp_2",
    name: "投資分析コンペ",
    organization: "野村證券",
    category: "finance",
    issuedAt: "2024-09-20",
  },
  {
    id: "stamp_3",
    name: "マーケティング講座",
    organization: "電通",
    category: "marketing",
    issuedAt: "2024-08-10",
  },
  {
    id: "stamp_4",
    name: "グローバル研修",
    organization: "三菱商事",
    category: "business",
    issuedAt: "2024-07-05",
  },
  {
    id: "stamp_5",
    name: "貿易実務",
    organization: "三菱商事",
    category: "business",
    issuedAt: "2024-10-12",
  },
];

export const mockNFTs = [
  {
    id: "nft_1",
    tokenId: 1,
    name: "金融リテラシー NFT",
    rarity: "rare",
    organizations: ["野村證券"],
    stampIds: ["stamp_1", "stamp_2"],
    mintedAt: "2024-09-25",
    tokenURI: "ipfs://example1",
  },
];

export const mockUser = {
  name: "田中太郎",
  email: "tanaka@example.com",
  walletAddress: null,
};

