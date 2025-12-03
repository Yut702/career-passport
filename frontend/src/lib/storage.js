// ローカルストレージ管理
import { mockStamps, mockNFTs, mockUser } from "../data/mockData.js";

const STORAGE_KEYS = {
  STAMPS: "careerpassport_stamps",
  NFTS: "careerpassport_nfts",
  USER: "careerpassport_user",
};

export const storage = {
  // スタンプ
  getStamps: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAMPS);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Error getting stamps:", err);
      return [];
    }
  },

  saveStamps: (stamps) => {
    try {
      localStorage.setItem(STORAGE_KEYS.STAMPS, JSON.stringify(stamps));
    } catch (err) {
      console.error("Error saving stamps:", err);
      throw new Error("スタンプの保存に失敗しました");
    }
  },

  addStamp: (stamp) => {
    try {
      const stamps = storage.getStamps();
      const newStamp = {
        id: stamp.id || `stamp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: stamp.name,
        organization: stamp.organization,
        category: stamp.category,
        issuedAt: stamp.issuedAt || new Date().toISOString().split("T")[0],
      };
      stamps.push(newStamp);
      storage.saveStamps(stamps);
      return stamps;
    } catch (err) {
      console.error("Error adding stamp:", err);
      throw new Error("スタンプの追加に失敗しました");
    }
  },

  // NFT
  getNFTs: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NFTS);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Error getting NFTs:", err);
      return [];
    }
  },

  saveNFTs: (nfts) => {
    try {
      localStorage.setItem(STORAGE_KEYS.NFTS, JSON.stringify(nfts));
    } catch (err) {
      console.error("Error saving NFTs:", err);
      throw new Error("NFTの保存に失敗しました");
    }
  },

  addNFT: (nft) => {
    try {
      const nfts = storage.getNFTs();
      const newNFT = {
        id: nft.id || `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tokenId: nft.tokenId,
        name: nft.name,
        description: nft.description || '',
        rarity: nft.rarity,
        organizations: nft.organizations || [],
        stampIds: nft.stampIds || [],
        contractAddress: nft.contractAddress || '',
        transactionHash: nft.transactionHash || '',
        metadataURI: nft.metadataURI || '',
        mintedAt: nft.mintedAt || new Date().toISOString().split("T")[0],
      };
      nfts.push(newNFT);
      storage.saveNFTs(nfts);
      return nfts;
    } catch (err) {
      console.error("Error adding NFT:", err);
      throw new Error("NFTの追加に失敗しました");
    }
  },

  // ユーザー
  getUser: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Error getting user:", err);
      return null;
    }
  },

  saveUser: (user) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (err) {
      console.error("Error saving user:", err);
      throw new Error("ユーザー情報の保存に失敗しました");
    }
  },

  // 初期化（モックデータ投入）
  initMockData: () => {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.STAMPS)) {
        storage.saveStamps(mockStamps);
      }
      if (!localStorage.getItem(STORAGE_KEYS.NFTS)) {
        storage.saveNFTs(mockNFTs);
      }
      if (!localStorage.getItem(STORAGE_KEYS.USER)) {
        storage.saveUser(mockUser);
      }
    } catch (err) {
      console.error("Error initializing mock data:", err);
      throw new Error("データの初期化に失敗しました");
    }
  },
};
