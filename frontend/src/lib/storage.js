// ローカルストレージ管理
import { mockStamps, mockNFTs, mockUser } from "../data/mockData.js";

const STORAGE_KEYS = {
  STAMPS: "nonfungiblecareer_stamps",
  NFTS: "nonfungiblecareer_nfts",
  USER: "nonfungiblecareer_user",
  CONTRACT_VERSION: "nonfungiblecareer_contract_version", // コントラクトアドレスのバージョン管理
  APPROVED_COMPANIES: "nonfungiblecareer_approved_companies", // 承認された企業情報（ユーザー側）
  APPLICANTS: "nonfungiblecareer_applicants", // 応募者情報（企業側）
  ZKP_PROOFS: "nonfungiblecareer_zkp_proofs", // ZKP証明データ
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

  // 承認された企業情報（ユーザー側）
  getApprovedCompanies: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPROVED_COMPANIES);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Error getting approved companies:", err);
      return [];
    }
  },

  saveApprovedCompanies: (companies) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.APPROVED_COMPANIES,
        JSON.stringify(companies)
      );
    } catch (err) {
      console.error("Error saving approved companies:", err);
      throw new Error("企業情報の保存に失敗しました");
    }
  },

  addApprovedCompany: (company) => {
    try {
      const companies = storage.getApprovedCompanies();
      // 既に存在する場合は更新、存在しない場合は追加
      const existingIndex = companies.findIndex(
        (c) =>
          c.walletAddress.toLowerCase() === company.walletAddress.toLowerCase()
      );
      const newCompany = {
        walletAddress: company.walletAddress.toLowerCase(),
        companyName:
          company.companyName || company.organization || "不明な企業",
        organization:
          company.organization || company.companyName || "不明な企業",
        eventId: company.eventId || "",
        eventTitle: company.eventTitle || "",
        approvedAt: company.approvedAt || new Date().toISOString(),
      };
      if (existingIndex >= 0) {
        companies[existingIndex] = newCompany;
      } else {
        companies.push(newCompany);
      }
      storage.saveApprovedCompanies(companies);
      return companies;
    } catch (err) {
      console.error("Error adding approved company:", err);
      throw new Error("企業情報の追加に失敗しました");
    }
  },

  // 応募者情報（企業側）
  getApplicants: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLICANTS);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Error getting applicants:", err);
      return [];
    }
  },

  saveApplicants: (applicants) => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPLICANTS, JSON.stringify(applicants));
    } catch (err) {
      console.error("Error saving applicants:", err);
      throw new Error("応募者情報の保存に失敗しました");
    }
  },

  addApplicant: (applicant) => {
    try {
      const applicants = storage.getApplicants();
      // 既に存在する場合は更新、存在しない場合は追加
      const existingIndex = applicants.findIndex(
        (a) =>
          a.walletAddress.toLowerCase() ===
            applicant.walletAddress.toLowerCase() &&
          a.eventId === applicant.eventId
      );
      const newApplicant = {
        walletAddress: applicant.walletAddress.toLowerCase(),
        eventId: applicant.eventId || "",
        eventTitle: applicant.eventTitle || "",
        applicationId: applicant.applicationId || "",
        appliedAt: applicant.appliedAt || new Date().toISOString(),
        status: applicant.status || "pending",
      };
      if (existingIndex >= 0) {
        applicants[existingIndex] = newApplicant;
      } else {
        applicants.push(newApplicant);
      }
      storage.saveApplicants(applicants);
      return applicants;
    } catch (err) {
      console.error("Error adding applicant:", err);
      throw new Error("応募者情報の追加に失敗しました");
    }
  },

  // ZKP証明
  getZKPProofs: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ZKP_PROOFS);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Error getting ZKP proofs:", err);
      return [];
    }
  },

  saveZKPProofs: (proofs) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ZKP_PROOFS, JSON.stringify(proofs));
    } catch (err) {
      console.error("Error saving ZKP proofs:", err);
      throw new Error("ZKP証明の保存に失敗しました");
    }
  },

  addZKPProof: (proof) => {
    try {
      const proofs = storage.getZKPProofs();
      const newProof = {
        id:
          proof.id ||
          `zkp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...proof,
        createdAt: proof.createdAt || new Date().toISOString(),
      };
      proofs.push(newProof);
      storage.saveZKPProofs(proofs);
      return newProof;
    } catch (err) {
      console.error("Error adding ZKP proof:", err);
      throw new Error("ZKP証明の追加に失敗しました");
    }
  },

  getZKPProofById: (id) => {
    try {
      const proofs = storage.getZKPProofs();
      return proofs.find((p) => p.id === id);
    } catch (err) {
      console.error("Error getting ZKP proof:", err);
      return null;
    }
  },
};
