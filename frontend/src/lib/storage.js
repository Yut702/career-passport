// ローカルストレージ管理
import { mockStamps, mockNFTs, mockUser } from "../data/mockData.js";

const STORAGE_KEYS = {
  STAMPS: "nonfungiblecareer_stamps",
  NFTS: "nonfungiblecareer_nfts",
  USER: "nonfungiblecareer_user",
  CONTRACT_VERSION: "nonfungiblecareer_contract_version", // コントラクトアドレスのバージョン管理
};

// 現在のコントラクトアドレス（環境変数から取得）
const getCurrentContractAddresses = () => {
  return {
    nftContract: import.meta.env.VITE_NFT_CONTRACT_ADDRESS || "",
    stampManager: import.meta.env.VITE_STAMP_MANAGER_ADDRESS || "",
  };
};

// コントラクトアドレスのバージョンを取得
const getContractVersion = () => {
  const addresses = getCurrentContractAddresses();
  // アドレスを結合してハッシュ化（簡易版）
  return `${addresses.nftContract}_${addresses.stampManager}`;
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
        id:
          stamp.id ||
          `stamp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: stamp.name,
        organization: stamp.organization,
        category: stamp.category,
        issuedAt: stamp.issuedAt || new Date().toISOString().split("T")[0],
        userAddress: stamp.userAddress || "", // ユーザーアドレスを確実に保存
        contractAddress:
          stamp.contractAddress || getCurrentContractAddresses().stampManager, // コントラクトアドレスを保存
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
        id:
          nft.id ||
          `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tokenId: nft.tokenId,
        name: nft.name,
        description: nft.description || "",
        rarity: nft.rarity,
        organizations: nft.organizations || [],
        stampIds: nft.stampIds || [],
        contractAddress: nft.contractAddress || "",
        transactionHash: nft.transactionHash || "",
        metadataURI: nft.metadataURI || "",
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

  // コントラクトアドレスのバージョンチェック
  checkContractVersion: () => {
    try {
      const currentVersion = getContractVersion();
      const storedVersion = localStorage.getItem(STORAGE_KEYS.CONTRACT_VERSION);

      // バージョンが異なる場合、データをクリア
      if (storedVersion && storedVersion !== currentVersion) {
        console.warn(
          "コントラクトアドレスが変更されました。データをクリアします。"
        );
        storage.clearAll();
        localStorage.setItem(STORAGE_KEYS.CONTRACT_VERSION, currentVersion);
        return true; // クリアされたことを示す
      }

      // 初回起動時はバージョンを保存
      if (!storedVersion) {
        localStorage.setItem(STORAGE_KEYS.CONTRACT_VERSION, currentVersion);
      }

      return false; // クリアされなかったことを示す
    } catch (err) {
      console.error("Error checking contract version:", err);
      return false;
    }
  },

  // すべてのデータをクリア
  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.STAMPS);
      localStorage.removeItem(STORAGE_KEYS.NFTS);
      localStorage.removeItem(STORAGE_KEYS.USER);
      console.log("ローカルストレージをクリアしました");
    } catch (err) {
      console.error("Error clearing storage:", err);
      throw new Error("データのクリアに失敗しました");
    }
  },

  // スタンプのみクリア
  clearStamps: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.STAMPS);
      console.log("スタンプデータをクリアしました");
    } catch (err) {
      console.error("Error clearing stamps:", err);
      throw new Error("スタンプデータのクリアに失敗しました");
    }
  },

  // NFTのみクリア
  clearNFTs: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.NFTS);
      console.log("NFTデータをクリアしました");
    } catch (err) {
      console.error("Error clearing NFTs:", err);
      throw new Error("NFTデータのクリアに失敗しました");
    }
  },
};
