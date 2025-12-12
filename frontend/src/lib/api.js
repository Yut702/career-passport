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
};
