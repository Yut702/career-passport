/**
 * API クライアント
 *
 * バックエンドAPIとの通信を行うためのクライアントライブラリ
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * API リクエストの共通処理
 *
 * @param {string} endpoint - APIエンドポイント
 * @param {Object} options - リクエストオプション
 * @returns {Promise<Object>} APIレスポンス
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // レスポンスが空の場合やJSONパースエラーを防ぐ
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // JSONパースに失敗した場合
        const text = await response.text();
        throw new Error(
          `Invalid JSON response: ${
            text || response.statusText || jsonError.message
          }`
        );
      }
    } else {
      // JSON以外のレスポンスの場合
      const text = await response.text();
      data = { error: text || response.statusText };
    }

    if (!response.ok) {
      const errorMessage =
        data.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // ネットワークエラーの場合
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error("API request error: Network error", error);
      throw new Error("ネットワークエラー: サーバーに接続できません");
    }
    console.error("API request error:", error);
    throw error;
  }
}

/**
 * イベント応募 API
 */
export const eventAPI = {
  /**
   * イベントを作成（企業向け）
   *
   * @param {Object} eventData - イベントデータ
   * @returns {Promise<Object>} 作成されたイベント
   */
  create: async (eventData) => {
    return request("/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  },

  /**
   * イベント一覧を取得
   *
   * @param {string} orgWalletAddress - 企業のウォレットアドレス（オプション）
   * @returns {Promise<Object>} イベント一覧
   */
  getAll: async (orgWalletAddress) => {
    const query = orgWalletAddress
      ? `?orgWalletAddress=${orgWalletAddress}`
      : "";
    return request(`/events${query}`);
  },

  /**
   * イベント詳細を取得
   *
   * @param {string} eventId - イベントID
   * @returns {Promise<Object>} イベント詳細
   */
  getById: async (eventId) => {
    return request(`/events/${eventId}`);
  },

  /**
   * イベントを更新（企業向け）
   *
   * @param {string} eventId - イベントID
   * @param {Object} updates - 更新データ
   * @returns {Promise<Object>} 更新されたイベント
   */
  update: async (eventId, updates) => {
    return request(`/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  /**
   * イベントを削除（企業向け）
   *
   * @param {string} eventId - イベントID
   * @returns {Promise<Object>} 削除結果
   */
  delete: async (eventId) => {
    return request(`/events/${eventId}`, {
      method: "DELETE",
    });
  },

  /**
   * イベントに応募
   *
   * @param {string} eventId - イベントID
   * @param {string} walletAddress - ウォレットアドレス
   * @param {string} applicationText - 応募動機
   * @returns {Promise<Object>} 応募情報
   */
  apply: async (eventId, walletAddress, applicationText) => {
    return request(`/events/${eventId}/apply`, {
      method: "POST",
      body: JSON.stringify({ walletAddress, applicationText }),
    });
  },

  /**
   * 自分の応募一覧を取得
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @returns {Promise<Object>} 応募一覧
   */
  getMyApplications: async (walletAddress) => {
    return request(`/events/applications?walletAddress=${walletAddress}`);
  },

  /**
   * イベントの応募一覧を取得（企業向け）
   *
   * @param {string} eventId - イベントID
   * @returns {Promise<Object>} 応募一覧
   */
  getEventApplications: async (eventId) => {
    return request(`/events/${eventId}/applications`);
  },

  /**
   * 応募ステータスを更新（企業向け）
   *
   * @param {string} applicationId - 応募ID
   * @param {string} status - ステータス（pending, approved, rejected）
   * @returns {Promise<Object>} 更新結果
   */
  updateApplicationStatus: async (applicationId, status) => {
    return request(`/events/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

/**
 * メッセージ API
 */
export const messageAPI = {
  /**
   * メッセージを送信
   *
   * @param {string} senderAddress - 送信者のウォレットアドレス
   * @param {string} receiverAddress - 受信者のウォレットアドレス
   * @param {string} content - メッセージ内容
   * @returns {Promise<Object>} 送信されたメッセージ
   */
  send: async (senderAddress, receiverAddress, content) => {
    return request("/messages", {
      method: "POST",
      body: JSON.stringify({ senderAddress, receiverAddress, content }),
    });
  },

  /**
   * 会話一覧を取得
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @returns {Promise<Object>} 会話一覧
   */
  getConversations: async (walletAddress) => {
    return request(`/messages/conversations?walletAddress=${walletAddress}`);
  },

  /**
   * 会話のメッセージ一覧を取得
   *
   * @param {string} conversationId - 会話ID
   * @returns {Promise<Object>} メッセージ一覧
   */
  getMessages: async (conversationId) => {
    return request(`/messages/conversations/${conversationId}`);
  },

  /**
   * メッセージを既読にする
   *
   * @param {string} messageId - メッセージID
   * @returns {Promise<Object>} 更新結果
   */
  markAsRead: async (messageId) => {
    return request(`/messages/${messageId}/read`, {
      method: "PATCH",
    });
  },
};

/**
 * マッチング API
 */
export const matchAPI = {
  /**
   * マッチングを作成
   *
   * @param {string} studentAddress - 学生のウォレットアドレス
   * @param {string} orgAddress - 企業のウォレットアドレス
   * @param {string} zkpProofHash - ZKP証明のハッシュ（オプション）
   * @returns {Promise<Object>} マッチング情報
   */
  create: async (studentAddress, orgAddress, zkpProofHash) => {
    return request("/matches", {
      method: "POST",
      body: JSON.stringify({ studentAddress, orgAddress, zkpProofHash }),
    });
  },

  /**
   * 学生のマッチング一覧を取得
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @returns {Promise<Object>} マッチング一覧
   */
  getStudentMatches: async (walletAddress) => {
    return request(`/matches/student?walletAddress=${walletAddress}`);
  },

  /**
   * 企業のマッチング一覧を取得
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @returns {Promise<Object>} マッチング一覧
   */
  getOrgMatches: async (walletAddress) => {
    return request(`/matches/org?walletAddress=${walletAddress}`);
  },

  /**
   * マッチング詳細を取得
   *
   * @param {string} matchId - マッチングID
   * @returns {Promise<Object>} マッチング詳細
   */
  getMatchById: async (matchId) => {
    return request(`/matches/${matchId}`);
  },

  /**
   * マッチングステータスを更新
   *
   * @param {string} matchId - マッチングID
   * @param {string} status - ステータス（active, closed）
   * @returns {Promise<Object>} 更新結果
   */
  updateMatchStatus: async (matchId, status) => {
    return request(`/matches/${matchId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  /**
   * 学生側から見たマッチング候補を検索
   *
   * @param {string} walletAddress - 学生のウォレットアドレス
   * @returns {Promise<Object>} マッチング候補一覧
   */
  searchStudentMatches: async (walletAddress) => {
    return request(`/matches/search/student?walletAddress=${walletAddress}`);
  },

  /**
   * 企業側から見たマッチング候補を検索
   *
   * @param {string} walletAddress - 企業のウォレットアドレス
   * @returns {Promise<Object>} マッチング候補一覧
   */
  searchOrgMatches: async (walletAddress) => {
    return request(`/matches/search/org?walletAddress=${walletAddress}`);
  },
};

/**
 * 求人条件 API
 */
export const jobConditionAPI = {
  /**
   * 学生側の求人条件を保存
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @param {Object} conditionData - 求人条件データ
   * @returns {Promise<Object>} 保存結果
   */
  saveJobCondition: async (walletAddress, conditionData) => {
    return request("/job-conditions", {
      method: "POST",
      body: JSON.stringify({ walletAddress, ...conditionData }),
    });
  },

  /**
   * 学生側の求人条件を取得
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @returns {Promise<Object>} 求人条件
   */
  getJobCondition: async (walletAddress) => {
    return request(`/job-conditions?walletAddress=${walletAddress}`);
  },

  /**
   * 企業側の採用条件を保存
   *
   * @param {string} orgAddress - 企業のウォレットアドレス
   * @param {Object} conditionData - 採用条件データ
   * @returns {Promise<Object>} 保存結果
   */
  saveRecruitmentCondition: async (orgAddress, conditionData) => {
    return request("/job-conditions/recruitment", {
      method: "POST",
      body: JSON.stringify({ orgAddress, ...conditionData }),
    });
  },

  /**
   * 企業側の採用条件を取得
   *
   * @param {string} orgAddress - 企業のウォレットアドレス
   * @returns {Promise<Object>} 採用条件
   */
  getRecruitmentCondition: async (orgAddress) => {
    return request(`/job-conditions/recruitment?orgAddress=${orgAddress}`);
  },
};

/**
 * 企業管理 API
 */
export const companyAPI = {
  /**
   * ウォレットアドレスで企業を取得
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @returns {Promise<Object>} 企業データ
   */
  getByWalletAddress: async (walletAddress) => {
    return request(`/companies/${walletAddress}`);
  },

  /**
   * すべての企業を取得
   *
   * @param {string} status - ステータスでフィルタ（オプション）
   * @returns {Promise<Object>} 企業一覧
   */
  getAll: async (status = null) => {
    const query = status ? `?status=${status}` : "";
    return request(`/companies${query}`);
  },

  /**
   * 企業を登録または更新
   *
   * @param {Object} companyData - 企業データ
   * @param {string} companyData.walletAddress - ウォレットアドレス
   * @param {string} companyData.companyName - 企業名
   * @param {string} companyData.status - ステータス（オプション）
   * @returns {Promise<Object>} 登録された企業データ
   */
  createOrUpdate: async (companyData) => {
    return request("/companies", {
      method: "POST",
      body: JSON.stringify(companyData),
    });
  },
};

/**
 * ZKP証明 API
 */
export const zkpProofAPI = {
  /**
   * ZKP証明を保存（完全なデータはdataフォルダ、公開情報はデータベース）
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @param {Object} fullProofData - 完全な証明データ
   * @param {Object} publicInfo - 公開情報のみ
   * @returns {Promise<Object>} 保存結果
   */
  saveZKPProof: async (walletAddress, fullProofData, publicInfo) => {
    return request("/zkp-proofs", {
      method: "POST",
      body: JSON.stringify({ walletAddress, fullProofData, publicInfo }),
    });
  },

  /**
   * ウォレットアドレスでZKP証明の公開情報一覧を取得
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @returns {Promise<Object>} ZKP証明一覧
   */
  getZKPProofs: async (walletAddress) => {
    return request(`/zkp-proofs?walletAddress=${walletAddress}`);
  },

  /**
   * 証明IDでZKP証明の公開情報を取得
   *
   * @param {string} proofId - 証明ID
   * @returns {Promise<Object>} ZKP証明
   */
  getZKPProofById: async (proofId) => {
    return request(`/zkp-proofs/${proofId}`);
  },

  /**
   * 証明IDでZKP証明の完全なデータを取得
   *
   * @param {string} proofId - 証明ID
   * @returns {Promise<Object>} 完全なZKP証明データ
   */
  getZKPProofFull: async (proofId) => {
    return request(`/zkp-proofs/${proofId}/full`);
  },
};

/**
 * NFT申請 API
 */
export const nftApplicationAPI = {
  /**
   * NFT申請を作成
   *
   * @param {string} userWalletAddress - ユーザーのウォレットアドレス
   * @param {string} orgWalletAddress - 企業のウォレットアドレス
   * @param {string} organization - 企業名
   * @param {number} stampCount - スタンプ数
   * @returns {Promise<Object>} 作成された申請
   */
  create: async (
    userWalletAddress,
    orgWalletAddress,
    organization,
    stampCount
  ) => {
    return request("/nft-applications", {
      method: "POST",
      body: JSON.stringify({
        userWalletAddress,
        orgWalletAddress,
        organization,
        stampCount,
      }),
    });
  },

  /**
   * ユーザーの申請一覧を取得
   *
   * @param {string} walletAddress - ウォレットアドレス
   * @returns {Promise<Array>} 申請一覧
   */
  getByUser: async (walletAddress) => {
    return request(`/nft-applications/user/${walletAddress}`);
  },

  /**
   * 企業の申請一覧を取得
   *
   * @param {string} walletAddress - 企業のウォレットアドレス
   * @returns {Promise<Array>} 申請一覧
   */
  getByOrg: async (walletAddress) => {
    return request(`/nft-applications/org/${walletAddress}`);
  },

  /**
   * 申請詳細を取得
   *
   * @param {string} applicationId - 申請ID
   * @returns {Promise<Object>} 申請詳細
   */
  getById: async (applicationId) => {
    return request(`/nft-applications/${applicationId}`);
  },

  /**
   * 申請ステータスを更新
   *
   * @param {string} applicationId - 申請ID
   * @param {string} status - ステータス（pending, approved, rejected, issued）
   * @returns {Promise<Object>} 更新された申請
   */
  updateStatus: async (applicationId, status) => {
    return request(`/nft-applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  /**
   * 申請を削除
   *
   * @param {string} applicationId - 申請ID
   * @returns {Promise<Object>} 削除結果
   */
  delete: async (applicationId) => {
    return request(`/nft-applications/${applicationId}`, {
      method: "DELETE",
    });
  },
};
