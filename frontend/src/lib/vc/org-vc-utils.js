/**
 * 企業向けVCユーティリティ関数
 *
 * 企業向けVC（法人登記証明書、税務証明書など）から
 * 企業名などの情報を取得するためのユーティリティ関数を提供します。
 */

/**
 * ウォレットアドレスと企業名のマッピング（モックデータ）
 * チェックリストに記載されているウォレットアドレスに対して、
 * VCで検証された企業名を自動設定します。
 */
const WALLET_TO_ORGANIZATION_MAP = {
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": "テックイノベーション株式会社",
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906": "マーケティングプロ株式会社",
  "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc":
    "クリエイティブスタジオ株式会社",
};

/**
 * ウォレットアドレスから企業名を取得（モックデータ）
 * @param {string} walletAddress - ウォレットアドレス
 * @returns {string|null} 企業名（見つからない場合はnull）
 */
export function getOrganizationNameFromWallet(walletAddress) {
  if (!walletAddress) return null;

  // 大文字小文字を区別しないように小文字に変換
  const normalizedAddress = walletAddress.toLowerCase();

  // マッピングから企業名を取得
  const orgName = Object.entries(WALLET_TO_ORGANIZATION_MAP).find(
    ([address]) => address.toLowerCase() === normalizedAddress
  )?.[1];

  return orgName || null;
}

/**
 * 企業名からウォレットアドレスを取得（モックデータ）
 * @param {string} organizationName - 企業名
 * @returns {string|null} ウォレットアドレス（見つからない場合はnull）
 */
export function getWalletAddressFromOrganization(organizationName) {
  if (!organizationName) return null;

  // マッピングからウォレットアドレスを取得
  const entry = Object.entries(WALLET_TO_ORGANIZATION_MAP).find(
    ([, name]) => name === organizationName
  );

  return entry ? entry[0] : null;
}

/**
 * 企業名からウォレットアドレスを取得（非同期、データベース優先）
 * @param {string} organizationName - 企業名
 * @returns {Promise<string|null>} ウォレットアドレス（見つからない場合はnull）
 */
export async function getWalletAddressFromOrganizationAsync(organizationName) {
  if (!organizationName) return null;

  try {
    // データベースから取得を試みる
    const { companyAPI } = await import("../../lib/api.js");
    const companies = await companyAPI.getAll();
    const company = companies.companies?.find(
      (c) => c.companyName === organizationName
    );
    if (company?.walletAddress) {
      return company.walletAddress;
    }
  } catch (error) {
    console.warn("Failed to fetch company from DB:", error);
  }

  // データベースにない場合は、マッピングから取得
  return getWalletAddressFromOrganization(organizationName);
}

/**
 * ローカルストレージから企業向けVCを取得
 * @returns {Array} 企業向けVCの配列
 */
export function getOrgVCs() {
  try {
    const savedVCs = localStorage.getItem("orgVCs");
    return savedVCs ? JSON.parse(savedVCs) : [];
  } catch (error) {
    console.error("Error loading org VCs:", error);
    return [];
  }
}

/**
 * ウォレットアドレスに基づいてモックVCを初期化
 * チェックリストに記載されているウォレットアドレスの場合、
 * 自動的にVCを設定します。
 * @param {string} walletAddress - ウォレットアドレス
 * @returns {Object|null} モックVCオブジェクト（該当する場合）
 */
export function initializeMockVCForWallet(walletAddress) {
  const orgName = getOrganizationNameFromWallet(walletAddress);

  if (!orgName) {
    return null;
  }

  // 既にVCが存在する場合は初期化しない
  const existingVCs = getOrgVCs();
  const hasCorporateVC = existingVCs.some(
    (vc) =>
      vc.type === "corporateRegistration" &&
      vc.attributes?.companyName === orgName
  );

  if (hasCorporateVC) {
    return null;
  }

  // モックVCを作成
  const mockVC = {
    id: `vc_mock_${walletAddress.toLowerCase().slice(2, 10)}`,
    type: "corporateRegistration",
    issuer: "法務省",
    issuedAt: new Date().toISOString(),
    attributes: {
      companyName: orgName,
      registrationNumber: `REG${Date.now()}`,
      establishmentDate: "2020-01-01",
      address: "東京都...",
    },
    verified: true, // VC検証済みとして設定
    walletAddress: walletAddress.toLowerCase(), // ウォレットアドレスを記録
  };

  // ローカルストレージに保存
  const updatedVCs = [...existingVCs, mockVC];
  localStorage.setItem("orgVCs", JSON.stringify(updatedVCs));

  return mockVC;
}

/**
 * VCから企業名を取得
 * @param {Array} vcs - VCの配列（省略時はローカルストレージから取得）
 * @returns {string|null} 企業名（見つからない場合はnull）
 */
export function getOrganizationNameFromVC(vcs = null) {
  const orgVCs = vcs || getOrgVCs();

  // 法人登記証明書から企業名を取得（最優先）
  const corporateVC = orgVCs.find((vc) => vc.type === "corporateRegistration");
  if (corporateVC && corporateVC.attributes?.companyName) {
    return corporateVC.attributes.companyName;
  }

  // 業界認証から企業名を取得（フォールバック）
  const industryVC = orgVCs.find((vc) => vc.type === "industryCertification");
  if (industryVC && industryVC.attributes?.certificationName) {
    // 認証名から企業名を推測（実際の実装では別のフィールドが必要かも）
    return industryVC.attributes.certificationName;
  }

  return null;
}

/**
 * VCが検証済みかどうかをチェック（モック実装）
 * @param {Object} vc - VCオブジェクト
 * @returns {boolean} 検証済みかどうか
 */
export function isVCVerified(vc) {
  // モック実装: verifiedフラグをチェック
  // 将来的には、proofフィールドの署名検証を実装
  if (vc.verified === true) {
    return true;
  }

  // proofフィールドが存在する場合は検証済みとみなす（将来的な実装用）
  if (vc.proof && typeof vc.proof === "object") {
    // 実際の実装では、ここで署名検証を行う
    return true; // モック実装
  }

  return false;
}

/**
 * データベースから企業名を取得（非同期）
 * @param {string} walletAddress - ウォレットアドレス
 * @returns {Promise<string|null>} 企業名（見つからない場合はnull）
 */
export async function getCompanyNameFromDatabase(walletAddress) {
  if (!walletAddress) return null;

  try {
    const { companyAPI } = await import("../../lib/api.js");
    const response = await companyAPI.getByWalletAddress(walletAddress);
    return response.company?.companyName || null;
  } catch (error) {
    console.warn("Failed to get company name from database:", error);
    return null;
  }
}

/**
 * 特定のウォレットアドレスに対応するVCから企業名を取得
 * 優先順位: VC > マッピング > フォールバック
 * @param {string} walletAddress - ウォレットアドレス
 * @param {Array} vcs - VCの配列（省略時はローカルストレージから取得）
 * @returns {string|null} 企業名（見つからない場合はnull）
 */
export function getVerifiedOrganizationNameForWallet(
  walletAddress,
  vcs = null
) {
  if (!walletAddress) return null;

  const orgVCs = vcs || getOrgVCs();
  const normalizedAddress = walletAddress.toLowerCase();

  // まず、ウォレットアドレスに紐づくVCを探す
  const walletVC = orgVCs.find(
    (vc) => vc.walletAddress === normalizedAddress && isVCVerified(vc)
  );

  if (walletVC) {
    // ウォレットアドレスに紐づくVCが見つかった場合
    if (
      walletVC.type === "corporateRegistration" &&
      walletVC.attributes?.companyName
    ) {
      return walletVC.attributes.companyName;
    }
    if (
      walletVC.type === "industryCertification" &&
      walletVC.attributes?.certificationName
    ) {
      return walletVC.attributes.certificationName;
    }
  }

  // ウォレットアドレスに紐づくVCが見つからない場合、マッピングから取得
  const orgNameFromMap = getOrganizationNameFromWallet(walletAddress);
  if (orgNameFromMap) {
    return orgNameFromMap;
  }

  // それでも見つからない場合、すべての検証済みVCから取得（フォールバック）
  const verifiedVCs = orgVCs.filter((vc) => isVCVerified(vc));
  if (verifiedVCs.length > 0) {
    return getOrganizationNameFromVC(verifiedVCs);
  }

  return null;
}

/**
 * 特定のウォレットアドレスに対応する企業名を取得（非同期、データベース優先）
 * 優先順位: データベース > VC > マッピング > フォールバック
 * @param {string} walletAddress - ウォレットアドレス
 * @param {Array} vcs - VCの配列（省略時はローカルストレージから取得）
 * @returns {Promise<string|null>} 企業名（見つからない場合はnull）
 */
export async function getVerifiedOrganizationNameForWalletAsync(
  walletAddress,
  vcs = null
) {
  if (!walletAddress) return null;

  // まずデータベースから取得を試みる
  const dbCompanyName = await getCompanyNameFromDatabase(walletAddress);
  if (dbCompanyName) {
    return dbCompanyName;
  }

  // データベースにない場合は、VCから取得
  return getVerifiedOrganizationNameForWallet(walletAddress, vcs);
}

/**
 * 検証済みのVCから企業名を取得（全VCから取得、後方互換性のため残す）
 * @param {Array} vcs - VCの配列（省略時はローカルストレージから取得）
 * @returns {string|null} 検証済みVCから取得した企業名
 */
export function getVerifiedOrganizationName(vcs = null) {
  const orgVCs = vcs || getOrgVCs();

  // 検証済みのVCのみを対象とする
  const verifiedVCs = orgVCs.filter((vc) => isVCVerified(vc));

  if (verifiedVCs.length === 0) {
    return null;
  }

  return getOrganizationNameFromVC(verifiedVCs);
}

/**
 * 特定のウォレットアドレスに対応するVCの検証状態を取得
 * @param {string} walletAddress - ウォレットアドレス
 * @param {Array} vcs - VCの配列（省略時はローカルストレージから取得）
 * @returns {Object} 検証状態の情報
 */
export function getVCVerificationStatusForWallet(walletAddress, vcs = null) {
  if (!walletAddress) {
    return {
      hasVCs: false,
      hasVerifiedVCs: false,
      hasCorporateVC: false,
      organizationName: null,
    };
  }

  const orgVCs = vcs || getOrgVCs();
  const normalizedAddress = walletAddress.toLowerCase();

  // ウォレットアドレスに紐づくVCを探す
  const walletVCs = orgVCs.filter(
    (vc) => vc.walletAddress === normalizedAddress
  );
  const verifiedWalletVCs = walletVCs.filter((vc) => isVCVerified(vc));
  const corporateVC = verifiedWalletVCs.find(
    (vc) => vc.type === "corporateRegistration"
  );

  const organizationName = getVerifiedOrganizationNameForWallet(
    walletAddress,
    orgVCs
  );

  return {
    hasVCs: walletVCs.length > 0,
    hasVerifiedVCs: verifiedWalletVCs.length > 0,
    hasCorporateVC: !!corporateVC,
    organizationName: organizationName,
  };
}

/**
 * VCの検証状態を取得（全VCから取得、後方互換性のため残す）
 * @param {Array} vcs - VCの配列（省略時はローカルストレージから取得）
 * @returns {Object} 検証状態の情報
 */
export function getVCVerificationStatus(vcs = null) {
  const orgVCs = vcs || getOrgVCs();

  const verifiedVCs = orgVCs.filter((vc) => isVCVerified(vc));
  const corporateVC = verifiedVCs.find(
    (vc) => vc.type === "corporateRegistration"
  );

  return {
    hasVCs: orgVCs.length > 0,
    hasVerifiedVCs: verifiedVCs.length > 0,
    hasCorporateVC: !!corporateVC,
    organizationName: getVerifiedOrganizationName(orgVCs),
  };
}
